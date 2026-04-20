import mongoose from 'mongoose'

const AnalysisSessionSchema = new mongoose.Schema({
  session_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    default: '',
    index: true,
  },
  version_label: {
    type: String,
    default: '',
  },
  resume_name: {
    type: String,
    default: '',
  },
  source_type: {
    type: String,
    enum: ['pdf', 'text'],
    default: 'text',
  },
  resume_text: {
    type: String,
    required: true,
  },
  job_description: {
    type: String,
    default: '',
  },
  linkedin_url: {
    type: String,
    default: '',
  },
  linkedin_profile: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  analysis_json: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  email_report: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true,
  },
})

export default mongoose.models.AnalysisSession || mongoose.model('AnalysisSession', AnalysisSessionSchema)
