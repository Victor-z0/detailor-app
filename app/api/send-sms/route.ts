import { NextResponse } from 'next/server';
import { Twilio } from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new Twilio(accountSid, authToken);

export async function POST(req: Request) {
  try {
    const { to, message } = await req.json();

    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio Number
      to: to,
    });

    return NextResponse.json({ success: true, sid: response.sid });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
