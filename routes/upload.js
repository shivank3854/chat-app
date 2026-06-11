const express = require('express')
const router = express.Router()
const multer = require('multer')
const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')

// configure cloudinary
cloudinary.config({
  cloud_name:'dbft2iymu',

  api_key:'766492436671227',

  api_secret:'5CpTmOosNYGPys8RR5GqUMVuu1s'
})

// store files directly in cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'chat-app',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'txt'],
    resource_type: 'auto'
  }
})


const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } })

router.post('/', upload.single('file'), (req, res) => {
  console.log('Upload request received')
  console.log('File:', req.file)
  console.log('Error:', req.fileValidationError)

  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' })
  }
  res.json({
    filename: req.file.filename,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    url: req.file.path
  })
})

router.use((err, req, res, next) => {
  console.log('Multer error:', err.message)
  res.status(500).json({ message: err.message })
})
module.exports = router