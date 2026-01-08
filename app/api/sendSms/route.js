import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { receiver, message } = body;

    // 알리고에 보낼 편지 봉투 만들기
    const formData = new URLSearchParams();
    formData.append('key', process.env.ALIGO_KEY);
    formData.append('userid', process.env.ALIGO_USER_ID);
    formData.append('sender', process.env.ALIGO_SENDER);
    formData.append('receiver', receiver); 
    formData.append('msg', message);
    formData.append('msg_type', 'LMS'); // 긴 문자(LMS)

    // 알리고로 발송!
    const response = await fetch('https://apis.aligo.in/send/', {
      method: 'POST',
      body: formData,
    });
    
    const result = await response.json();

    // 결과 확인
    if (result.result_code == 1) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: result.message });
    }

  } catch (error) {
    return NextResponse.json({ success: false, error: '서버 에러 발생' });
  }
}