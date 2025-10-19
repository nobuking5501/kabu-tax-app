"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function FormNavigation() {
  const pathname = usePathname();

  const tabs = [
    { name: "入力フォーム", path: "/form1", icon: "📝" },
    { name: "申告ガイド", path: "/guide", icon: "📖" },
    { name: "使い方", path: "/guide/how-to-use", icon: "🖥️" },
  ];

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* ロゴ */}
          <div className="flex items-center gap-3">
            <Image
              src="/logo-40.png"
              alt="株式譲渡益自動計算ツール"
              width={40}
              height={40}
            />
            <div>
              <h1 className="text-lg font-bold text-gray-900">株式譲渡益自動計算ツール</h1>
            </div>
          </div>

          {/* タブナビゲーション */}
          <nav className="flex gap-1">
            {tabs.map((tab) => {
              const isActive = pathname === tab.path;
              return (
                <Link
                  key={tab.path}
                  href={tab.path}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }
                  `}
                >
                  <span className="mr-1">{tab.icon}</span>
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
