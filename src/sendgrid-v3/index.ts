import * as SendGrid from 'sendgrid'
import {plugin, init, sendTemplate, makeRequest, buildTemplateBody} from './src'

export default plugin({SendGrid, init, sendTemplate, makeRequest, buildTemplateBody})
