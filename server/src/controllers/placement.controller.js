const { Opportunity, Application, Notification } = require('../models/placement.model');

exports.createOpportunity = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.role || req.session.user.role.toUpperCase() !== 'INDUSTRY') {
      return res.status(403).json({ message: 'Only industry can create opportunities' });
    }
    const requiredFields = ['type', 'title', 'company_name', 'description', 'location', 'work_mode'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ success: false, message: `${field.replace('_', ' ')} is required` });
      }
    }

    const data = { ...req.body, industry_id: req.session.user.id };
    const opportunity = await Opportunity.create(data);
    
    // If published/active, we can notify students
    if (['PUBLISHED', 'ACTIVE'].includes(opportunity.status)) {
      // In a real app, query eligible students. Here we just notify all students as a baseline.
      const db = require('../config/database').getPool();
      const students = await db.query(`SELECT id FROM users WHERE role = 'STUDENT'`);
      for (const student of students.rows) {
        await Notification.create(
          student.id,
          `New ${opportunity.type === 'JOB' ? 'Job' : 'Internship'} Posted`,
          `${opportunity.title} at ${opportunity.company_name}`,
          'NEW_OPPORTUNITY',
          opportunity.id
        );
      }
    }
    
    res.status(201).json({ message: 'Opportunity created', opportunity });
  } catch (error) {
    console.error('Error creating opportunity:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getIndustryOpportunities = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.role || req.session.user.role.toUpperCase() !== 'INDUSTRY') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const opportunities = await Opportunity.findByIndustry(req.session.user.id);
    res.json(opportunities);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateOpportunityStatus = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.role || req.session.user.role.toUpperCase() !== 'INDUSTRY') return res.status(403).json({ message: 'Unauthorized' });
    const { status } = req.body;
    const opp = await Opportunity.updateStatus(req.params.id, req.session.user.id, status);
    if (!opp) return res.status(404).json({ message: 'Opportunity not found' });
    res.json({ message: 'Status updated', opportunity: opp });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getActiveOpportunities = async (req, res) => {
  try {
    const opportunities = await Opportunity.findActive();
    res.json(opportunities);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getOpportunityDetails = async (req, res) => {
  try {
    const opp = await Opportunity.findById(req.params.id);
    if (!opp) return res.status(404).json({ message: 'Not found' });
    res.json(opp);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Application
exports.applyForOpportunity = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.role || req.session.user.role.toUpperCase() !== 'STUDENT') return res.status(403).json({ message: 'Only students can apply' });
    
    const oppId = req.params.id;
    const studentId = req.session.user.id;
    
    const opp = await Opportunity.findById(oppId);
    if (!opp) return res.status(404).json({ message: 'Opportunity not found' });
    if (!['PUBLISHED', 'ACTIVE'].includes(opp.status)) {
      return res.status(400).json({ message: 'Opportunity is not active' });
    }
    if (opp.application_deadline && new Date(opp.application_deadline) < new Date()) {
      return res.status(400).json({ message: 'Application deadline has passed' });
    }

    const hasApplied = await Application.hasApplied(oppId, studentId);
    if (hasApplied) return res.status(400).json({ message: 'You have already applied' });

    // Build snapshot from student profile
    const db = require('../config/database').getPool();
    const profileRes = await db.query(
      `SELECT u.name, u.email, sp.* 
       FROM users u 
       LEFT JOIN student_profiles sp ON u.id = sp.user_id 
       WHERE u.id = $1`, [studentId]
    );
    const profileSnapshot = profileRes.rows[0];
    
    if (!profileSnapshot || !profileSnapshot.resume_file_url) {
      return res.status(400).json({ message: 'Resume is required to apply. Please update your profile first.' });
    }

    const application = await Application.apply(oppId, studentId, profileSnapshot);
    
    // Notify industry
    await Notification.create(
      opp.industry_id,
      'New Application',
      `${profileSnapshot.name} applied for ${opp.title}`,
      'NEW_APPLICATION',
      application.id
    );

    res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (error) {
    console.error('Error applying:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getStudentApplications = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.role || req.session.user.role.toUpperCase() !== 'STUDENT') return res.status(403).json({ message: 'Unauthorized' });
    const apps = await Application.findByStudent(req.session.user.id);
    res.json(apps);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getOpportunityApplications = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.role || req.session.user.role.toUpperCase() !== 'INDUSTRY') return res.status(403).json({ message: 'Unauthorized' });
    const apps = await Application.findByOpportunity(req.params.id, req.session.user.id);
    res.json(apps);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.role || req.session.user.role.toUpperCase() !== 'INDUSTRY') return res.status(403).json({ message: 'Unauthorized' });
    const { status } = req.body;
    const app = await Application.updateStatus(req.params.appId, req.params.oppId, req.session.user.id, status);
    
    // Notify student
    const opp = await Opportunity.findById(req.params.oppId);
    await Notification.create(
      app.student_id,
      'Application Update',
      `Your application for ${opp.title} at ${opp.company_name} is now ${status}`,
      'APPLICATION_UPDATE',
      app.id
    );

    res.json({ message: 'Application status updated', application: app });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// Notifications
exports.getNotifications = async (req, res) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    const notifs = unreadOnly 
      ? await Notification.findUnread(req.session.user.id)
      : await Notification.findAll(req.session.user.id);
    res.json(notifs);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    await Notification.markAsRead(req.params.id, req.session.user.id);
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};
