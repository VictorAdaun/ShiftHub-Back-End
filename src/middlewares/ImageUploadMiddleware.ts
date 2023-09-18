import { NextFunction, Request, Response } from 'express'
import { ExpressMiddlewareInterface } from 'routing-controllers'
import { Service } from 'typedi'
import { BadRequestError } from '../core/errors/errors'

import { v2 as cloudinary } from 'cloudinary'
import config from '../config'

const mainCloudApi = config('CLOUD_API_KEY')

cloudinary.config({
  cloud_name: config('CLOUD_NAME'),
  api_key: mainCloudApi.slice(1),
  api_secret: config('CLOUD_API_SECRET'),
})

@Service()
export class ImageUploadMiddleWare implements ExpressMiddlewareInterface {
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const allowedMimeTypes = ['image/jpeg']
    if (!req.files) {
      next()
    }
    const filePath: any = req.files
    if (filePath.length !== 1) {
      throw new BadRequestError('Multiple files received')
    }

    const fileOne = filePath[0]
    if (!allowedMimeTypes.includes(fileOne.mimetype)) {
      throw new BadRequestError('Invalid file request')
    }

    cloudinary.uploader
      .upload_stream(
        {
          resource_type: 'auto', // 'auto' for automatic resource type detection
          //   public_id: 'unique_public_id', // A unique identifier for the uploaded resource
          folder: 'scheduler', // Optional: specify a folder in your Cloudinary account
        },
        (error, result) => {
          if (error) {
            console.error('Error uploading to Cloudinary:', error)
            throw new BadRequestError(
              'Unable to upload image. Please try again later'
            )
          } else {
            req.body.avatar = result?.secure_url
            next()
          }
        }
      )
      .end(fileOne.buffer)
  }
}
