const studentService = require('../services/studentService');
const { getPool } = require('../config/database');
const fs = require('fs');

async function getStudentProfile(req, res, next) {
  try {
    const profile = await studentService.getStudentProfile(req.session.user.id);
    res.status(200).json({ profile });
  } catch (error) {
    next(error);
  }
}

async function updateStudentProfile(req, res, next) {
  try {
    const profile = await studentService.updateStudentProfile(req.session.user.id, req.body || {});
    res.status(200).json({ profile, message: 'Student profile updated successfully.' });
  } catch (error) {
    next(error);
  }
}

async function uploadProfilePhoto(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No photo uploaded.' });
    }

    const dataBuffer = fs.readFileSync(req.file.path);
    const base64Data = dataBuffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';
    const photoUrl = `data:${mimeType};base64,${base64Data}`;
    
    const profile = await studentService.updateProfilePhoto(req.session.user.id, photoUrl);
    
    // Safely delete the temporary local file since we persisted to DB
    try { fs.unlinkSync(req.file.path); } catch (e) {}
    
    res.status(200).json({ profile, message: 'Profile photo updated.', photoUrl: profile.profilePhoto });
  } catch (error) {
    next(error);
  }
}

async function uploadResume(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No resume uploaded.' });
    }
    

    const dataBuffer = fs.readFileSync(req.file.path);
    const base64Data = dataBuffer.toString('base64');
    const mimeType = req.file.mimetype || 'application/pdf';
    const resumeUrl = `data:${mimeType};base64,${base64Data}`;
    
    // Attempt parsing
    let parsedData = null;
    let extractedSkills = [];
    try {
      const pdf = require('pdf-parse');
      const pdfData = await pdf(dataBuffer);
      const text = pdfData.text || '';
      
      if (!text.trim()) {
        throw new Error('No text extractable from PDF');
      }

      // Simple mock extraction based on text
      const possibleSkills = ['Python', 'JavaScript', 'React', 'Node.js', 'Java', 'C++', 'SQL', 'PostgreSQL', 'Docker'];
      extractedSkills = possibleSkills.filter(skill => text.toLowerCase().includes(skill.toLowerCase()));
      
      parsedData = {
        textLength: text.length,
        detectedSkills: extractedSkills,
        text: text
      };
    } catch (parseErr) {
      console.error('PDF parsing failed:', parseErr);
      
      // Save the file anyway
      const profile = await studentService.updateResumeFile(req.session.user.id, resumeUrl, null, []);
      
      return res.status(422).json({
        success: false,
        profile,
        error: {
          code: 'PDF_PARSE_ERROR',
          field: 'resume',
          message: 'The resume was uploaded, but its text could not be extracted.'
        }
      });
    }
    
    let parsedSkillsObj = [];
    let extractedGithub = '';
    let extractedLinkedin = '';
    
    if (parsedData) {
      parsedSkillsObj = extractedSkills.map(s => ({ name: s, level: 50, confidence: 0.8 }));
      
      const text = parsedData.text || '';
      
      const githubMatch = text.match(/github\.com\/([a-zA-Z0-9-]+)/i);
      if (githubMatch) {
        extractedGithub = `https://github.com/${githubMatch[1]}`;
      }
      
      const linkedinMatch = text.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/i);
      if (linkedinMatch) {
        extractedLinkedin = `https://linkedin.com/in/${linkedinMatch[1]}`;
      }
    }

    let profile = await studentService.updateResumeFile(req.session.user.id, resumeUrl, parsedData, parsedSkillsObj);
    
    if (parsedSkillsObj.length > 0 || extractedGithub || extractedLinkedin) {
      const existingSkills = profile.skills || [];
      const newSkills = [...existingSkills];
      
      parsedSkillsObj.forEach(ps => {
        if (!newSkills.find(s => s.name.toLowerCase() === ps.name.toLowerCase())) {
          newSkills.push(ps);
        }
      });
      
      const updates = { skills: newSkills };
      if (extractedGithub && !profile.githubUrl) updates.githubUrl = extractedGithub;
      if (extractedLinkedin && !profile.linkedinUrl) updates.linkedinUrl = extractedLinkedin;
      
      profile = await studentService.updateStudentProfile(req.session.user.id, updates);
    }
    

    try { fs.unlinkSync(req.file.path); } catch (e) {}
    
    res.status(200).json({ profile, message: 'Resume uploaded and parsed successfully.', resumeUrl: profile.resumeFileUrl, parsedData });
  } catch (error) {

    if (req.file && req.file.path) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    next(error);
  }
}

async function getStudentDashboard(req, res, next) {
  try {
    const dashboard = await studentService.getStudentDashboard(req.session.user.id);
    res.status(200).json({ dashboard });
  } catch (error) {
    next(error);
  }
}

async function getStudentSkills(req, res, next) {
  try {
    const data = await studentService.getStudentSkills(req.session.user.id);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

async function updateStudentSkills(req, res, next) {
  try {
    const data = await studentService.updateStudentSkills(req.session.user.id, req.body || {});
    res.status(200).json({ ...data, message: 'Student skills updated successfully.' });
  } catch (error) {
    next(error);
  }
}

async function getStudentTopics(req, res, next) {
  try {
    const data = await studentService.getStudentTopics(req.session.user.id);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

async function updateStudentTopics(req, res, next) {
  try {
    const data = await studentService.updateStudentTopics(req.session.user.id, req.body || {});
    res.status(200).json({ ...data, message: 'Student topic scores updated successfully.' });
  } catch (error) {
    next(error);
  }
}

async function getStudentEducation(req, res, next) {
  try {
    const data = await studentService.getStudentEducation(req.session.user.id);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

async function createStudentEducation(req, res, next) {
  try {
    const data = await studentService.createStudentEducation(req.session.user.id, req.body || {});
    res.status(201).json({ ...data, message: 'Education record added successfully.' });
  } catch (error) {
    next(error);
  }
}

async function updateStudentEducation(req, res, next) {
  try {
    const data = await studentService.updateStudentEducation(req.session.user.id, req.params.educationId, req.body || {});
    res.status(200).json({ ...data, message: 'Education record updated successfully.' });
  } catch (error) {
    next(error);
  }
}

async function deleteStudentEducation(req, res, next) {
  try {
    const data = await studentService.deleteStudentEducation(req.session.user.id, req.params.educationId);
    res.status(200).json({ ...data, message: 'Education record deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

async function getStudentProjects(req, res, next) {
  try {
    const data = await studentService.getStudentProjects(req.session.user.id);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

async function createStudentProject(req, res, next) {
  try {
    const data = await studentService.createProject(req.session.user.id, req.body || {});
    res.status(201).json({ ...data, message: 'Project added successfully.' });
  } catch (error) {
    next(error);
  }
}

async function updateStudentProject(req, res, next) {
  try {
    const data = await studentService.updateProject(req.session.user.id, req.params.projectId, req.body || {});
    res.status(200).json({ ...data, message: 'Project updated successfully.' });
  } catch (error) {
    next(error);
  }
}

async function deleteStudentProject(req, res, next) {
  try {
    const data = await studentService.deleteProject(req.session.user.id, req.params.projectId);
    res.status(200).json({ ...data, message: 'Project deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

async function submitStudentProject(req, res, next) {
  try {
    const data = await studentService.submitProjectForEvaluation(req.session.user.id, req.params.projectId, req.body || {});
    res.status(200).json({ ...data, message: 'Project submitted for evaluation.' });
  } catch (error) {
    next(error);
  }
}

async function getStudentInternships(req, res, next) {
  try {
    const data = await studentService.getStudentInternships(req.session.user.id);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

async function createStudentInternship(req, res, next) {
  try {
    const data = await studentService.createInternship(req.session.user.id, req.body || {});
    res.status(201).json({ ...data, message: 'Internship added successfully.' });
  } catch (error) {
    next(error);
  }
}

async function updateStudentInternship(req, res, next) {
  try {
    const data = await studentService.updateInternship(req.session.user.id, req.params.internshipId, req.body || {});
    res.status(200).json({ ...data, message: 'Internship updated successfully.' });
  } catch (error) {
    next(error);
  }
}

async function deleteStudentInternship(req, res, next) {
  try {
    const data = await studentService.deleteInternship(req.session.user.id, req.params.internshipId);
    res.status(200).json({ ...data, message: 'Internship deleted successfully.' });
  } catch (error) {
    next(error);
  }
}

async function submitStudentInternship(req, res, next) {
  try {
    const data = await studentService.submitInternshipForEvaluation(req.session.user.id, req.params.internshipId);
    res.status(200).json({ ...data, message: 'Internship submitted for evaluation.' });
  } catch (error) {
    next(error);
  }
}

async function getStudentCertifications(req, res, next) {
  try {
    const data = await studentService.getStudentCertifications(req.session.user.id);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

async function createStudentCertification(req, res, next) {
  try {
    const data = await studentService.createCertification(req.session.user.id, req.body || {});
    res.status(201).json({ ...data, message: 'Certification added successfully.' });
  } catch (error) {
    next(error);
  }
}

async function getStudentPortfolio(req, res, next) {
  try {
    const data = await studentService.getStudentPortfolio(req.session.user.id);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

async function getProfilePhotoFile(req, res, next) {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT profile_photo FROM users WHERE id = $1', [req.params.id]);
    if (!result.rows[0] || !result.rows[0].profile_photo || !result.rows[0].profile_photo.startsWith('data:')) {
      return res.status(404).send('Not found');
    }
    const dataUri = result.rows[0].profile_photo;
    const matches = dataUri.match(/^data:([a-zA-Z0-9\/\-\.]+);base64,(.*)$/);
    if (!matches || matches.length !== 3) return res.status(404).send('Invalid data');
    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}

async function getResumeFile(req, res, next) {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT resume_file_url FROM student_profiles WHERE user_id = $1', [req.params.id]);
    if (!result.rows[0] || !result.rows[0].resume_file_url || !result.rows[0].resume_file_url.startsWith('data:')) {
      return res.status(404).send('Not found');
    }
    const dataUri = result.rows[0].resume_file_url;
    const matches = dataUri.match(/^data:([a-zA-Z0-9\/\-\.]+);base64,(.*)$/);
    if (!matches || matches.length !== 3) return res.status(404).send('Invalid data');
    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', 'inline; filename="resume.pdf"');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStudentProfile,
  updateStudentProfile,
  getStudentDashboard,
  getStudentSkills,
  updateStudentSkills,
  getStudentTopics,
  updateStudentTopics,
  getStudentEducation,
  createStudentEducation,
  updateStudentEducation,
  deleteStudentEducation,
  getStudentProjects,
  createStudentProject,
  updateStudentProject,
  deleteStudentProject,
  submitStudentProject,
  getStudentInternships,
  createStudentInternship,
  updateStudentInternship,
  deleteStudentInternship,
  submitStudentInternship,
  getStudentCertifications,
  createStudentCertification,
  getStudentPortfolio,
  uploadProfilePhoto,
  uploadResume,
  getProfilePhotoFile,
  getResumeFile,
};
