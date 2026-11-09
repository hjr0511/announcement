import React from 'react';
import { ShieldCheck, X, FileText, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export const SecurityNoticeModal: React.FC<Props> = ({ isOpen, onClose, onAccept }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">個人資料保護與校務資訊安全宣告</h3>
              <p className="text-xs text-slate-400">符合中華民國《個人資料保護法》及教育部資安規範</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto text-sm text-slate-600 space-y-4 leading-relaxed">
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-xl flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold">高規格資安防護已啟動：</span>
              本系統採用 AES-256 傳輸加密、動態身分證遮罩、單元權限控管 (RBAC) 及嚴格之存取稽核軌跡 (Audit Log)，確保您的個人隱私與學業資料安全無虞。
            </div>
          </div>

          <section>
            <h4 className="font-bold text-slate-800 flex items-center mb-1 text-sm">
              <FileText className="w-4 h-4 mr-1.5 text-blue-600" /> 一、蒐集之目的與類別
            </h4>
            <p className="text-xs text-slate-600">
              依據公立及已立案私立學校學籍管理辦法，蒐集您的基本資料（學號、姓名、身分證字號、出生年月日、聯絡地址、電話）以及學業成績、操行評定與就學獎懲記錄，僅供本校教務、學務行政與教育統計之法定目的使用。
            </p>
          </section>

          <section>
            <h4 className="font-bold text-slate-800 flex items-center mb-1 text-sm">
              <FileText className="w-4 h-4 mr-1.5 text-blue-600" /> 二、個人資料之利用期間、地區及對象
            </h4>
            <p className="text-xs text-slate-600">
              1. 期間：自入學起至畢業後依法令規定之學籍檔案保存年限。<br />
              2. 對象與權限：教務處負責學籍成績業務；學務處負責生活輔導與獎懲；各處室遵循最小授權原則，嚴禁跨處室無故調閱敏感欄位。
            </p>
          </section>

          <section>
            <h4 className="font-bold text-slate-800 flex items-center mb-1 text-sm">
              <FileText className="w-4 h-4 mr-1.5 text-blue-600" /> 三、當事人權利與查詢規範
            </h4>
            <p className="text-xs text-slate-600">
              學生可隨時於本系統線上查閱個人學籍、下載成績單 PDF，並於每年個資校對期間線上提出基本通訊資料更正申請。系統於所有敏感操作皆留存存取日誌以供資安稽核。
            </p>
          </section>

          <section>
            <h4 className="font-bold text-slate-800 flex items-center mb-1 text-sm">
              <FileText className="w-4 h-4 mr-1.5 text-blue-600" /> 四、防偽防冒用措施
            </h4>
            <p className="text-xs text-slate-600">
              成績單 PDF 下載均具備唯一數位校驗序號 (Digital Verification Code) 與教務處註冊防偽印戳，任何塗改均失其法律效力。
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            返回
          </button>
          <button
            onClick={() => {
              onAccept();
              onClose();
            }}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg transition-all shadow-sm flex items-center space-x-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>我已詳閱並同意遵循規範</span>
          </button>
        </div>
      </div>
    </div>
  );
};
