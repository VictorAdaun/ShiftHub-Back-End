import { customAlphabet, nanoid } from 'nanoid'
import pkg from 'nanoid-dictionary'
const { alphanumeric } = pkg
import uuid from 'node-uuid'
import { Service } from 'typedi'

@Service()
export class UUIDService {
  generate(): string {
    return uuid.v4()
  }

  generateShort(size = 10) {
    return nanoid(size)
  }

  generateCustom(size = 15) {
    const nanoIdCustom = customAlphabet(alphanumeric, size)
    return nanoIdCustom()
  }

  generateCustomNumber(size = 6) {
    const nanoIdCustom = customAlphabet('1123456789', size)
    return parseInt(nanoIdCustom())
  }
}
