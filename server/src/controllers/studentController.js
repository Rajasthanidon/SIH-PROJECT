const studentService = require('../services/studentService');

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
    const photoUrl = `/uploads/photos/${req.file.filename}`;
    const profile = await studentService.updateProfilePhoto(req.session.user.id, photoUrl);
    res.status(200).json({ profile, message: 'Profile photo updated.', photoUrl });
  } catch (error) {
    next(error);
  }
}

async function uploadResume(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No resume uploaded.' });
    }
    const resumeUrl = `/uploads/resumes/${req.file.filename}`;
    
    // Attempt parsing
    let parsedData = null;
    let extractedSkills = [];
    try {
      const fs = require('fs');
      const pdf = require('pdf-parse');
      const dataBuffer = fs.readFileSync(req.file.path);
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
        detectedSkills: extractedSkills
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
    if (parsedData) {
      parsedSkillsObj = extractedSkills.map(s => ({ name: s, level: 50, confidence: 0.8 }));
    }

    const profile = await studentService.updateResumeFile(req.session.user.id, resumeUrl, parsedData, parsedSkillsObj);
    res.status(200).json({ profile, message: 'Resume uploaded successfully.', resumeUrl, parsedData });
  } catch (error) {
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
};
