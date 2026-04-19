import mongoose from 'mongoose'

const RoastSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  resume_text: {
    type: String,
    required: true,
  },
  result_json: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  brutal_mode: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 30, // Auto-delete after 30 days
  },
})

export default mongoose.models.Roast || mongoose.model('Roast', RoastSchema)
