'use client';
import { useEffect, useState } from 'react';

export default function GitBotDiffPage() {
  const [diffData, setDiffData] = useState<any[]>([]);

  useEffect(() => {
    // Gọi API từ Backend Go
    fetch('http://localhost:8080/api/v1/diff')
      .then(res => res.json())
      .then(data => setDiffData(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      {/* HEADER: Responsive từ PC đến Mobile */}
      <header className="border-b border-gray-800 p-4 sticky top-0 bg-gray-950 z-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <span className="bg-green-600 text-xs font-bold px-2 py-1 rounded-full text-white mr-2">Open</span>
          <h1 className="text-lg font-bold inline-block">PR #124: Tối ưu cơ chế bảo mật Login</h1>
        </div>
        <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all active:scale-95">
          Approve Code
        </button>
      </header>

      {/* BODY CONTAINER */}
      <main className="p-2 sm:p-6 max-w-7xl mx-auto">
        {diffData.map((file, fIdx) => (
          <div key={fIdx} className="mb-6 border border-gray-800 rounded-lg overflow-hidden bg-gray-950">
            {/* Thanh tiêu đề file */}
            <div className="bg-gray-900 px-4 py-3 border-b border-gray-800 text-sm font-mono text-gray-300 truncate">
              📄 {file.file_path}
            </div>

            {/* Vùng hiển thị Code Diff - Ép Unified View trên Mobile */}
            <div className="overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed">
              <div className="min-w-full table">
                {file.lines.map((line: any, lIdx: number) => {
                  // Định dạng màu sắc dựa vào loại dòng (Thêm/Xóa/Giữ nguyên)
                  let rowBg = "hover:bg-gray-900";
                  let textColor = "text-gray-400";
                  if (line.type === "addition") {
                    rowBg = "bg-green-950/40 hover:bg-green-900/40 border-l-4 border-green-500";
                    textColor = "text-green-300";
                  } else if (line.type === "deletion") {
                    rowBg = "bg-red-950/40 hover:bg-red-900/40 border-l-4 border-red-500";
                    textColor = "text-red-300";
                  }

                  return (
                    <div key={lIdx} className={`table-row ${rowBg}`}>
                      {/* Số dòng */}
                      <div className="table-cell text-gray-600 text-right pr-4 pl-2 select-none w-10 border-r border-gray-800/50">
                        {line.line_num}
                      </div>
                      {/* Nội dung code - word-break chống vỡ khung màn hình điện thoại */}
                      <div className={`table-cell pl-4 pr-2 whitespace-pre-wrap break-all ${textColor}`}>
                        {line.content}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
