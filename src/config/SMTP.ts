import nodemailer, {Transporter, TransportOptions} from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

let transportador: Transporter

export function getTransportador(): Transporter{
    if(!transportador){
        transportador = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: true,
            requireTLS: true,
            auth: {
                user: process.env.SMTP_USER?.trim(),
                pass: process.env.SMPT_PASS?.trim()
            },
            logger: true
        }as TransportOptions)
    } return transportador
}