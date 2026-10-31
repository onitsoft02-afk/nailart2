export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-200 mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        {/* 푸터 좌측: 회사 기본 정보 */}
        <div className="text-sm text-gray-500 space-y-1">
          <p className="font-bold text-gray-700 text-base mb-2">딸각 스튜디오</p>
          <p>대표: 홍길동 | 사업자등록번호: 123-45-67890</p>
          <p>통신판매업신고: 제 2026-서울강남-1234호</p>
          <p>주소: 서울특별시 강남구 테헤란로 123, 4층</p>
          <p>이메일: support@ttalgak.com</p>
        </div>

        {/* 푸터 우측: 이용 약관, 개인정보 처리 방침, 저작권 */}
        <div className="text-sm text-gray-500 flex flex-col items-start md:items-end space-y-2">
          <div className="space-x-4">
            <a href="#" className="hover:text-gray-900 transition-colors">이용 약관</a>
            <a href="#" className="hover:text-gray-900 transition-colors">개인정보 처리 방침</a>
          </div>
          <p>© 2026 딸각 스튜디오. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
