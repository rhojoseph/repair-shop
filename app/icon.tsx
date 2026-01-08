import { ImageResponse } from 'next/og';

// 아이콘 크기 설정
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// 아이콘 생성
export default function Icon() {
  return new ImageResponse(
    (
      // 아이콘 디자인 (검은 배경에 실타래)
      <div
        style={{
          fontSize: 24,
          background: 'black',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '20%', // 둥근 사각형
        }}
      >
        🧵
      </div>
    ),
    { ...size }
  );
}