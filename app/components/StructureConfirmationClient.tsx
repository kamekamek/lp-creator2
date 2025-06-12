'use client';

import { useState } from 'react';
import { useActions } from 'ai/rsc';
import { AI } from '../action';

interface LPSection {
  type: 'hero' | 'features' | 'testimonials' | 'cta' | 'faq' | 'footer';
  title: string;
  description: string;
}

interface LPStructure {
  title: string;
  sections: LPSection[];
}

interface StructureConfirmationClientProps {
  structure: LPStructure;
}

export function StructureConfirmationClient({ structure }: StructureConfirmationClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedStructure, setEditedStructure] = useState<LPStructure>(structure);
  const { submitUserMessage } = useActions<typeof AI>();

  const handleConfirm = async () => {
    // 重複実行を防ぐため、一度だけ実行されるようにする
    const button = document.querySelector('button[data-confirm="true"]') as HTMLButtonElement;
    if (button) {
      button.disabled = true;
      button.textContent = '生成中...';
    }
    
    try {
      // 構成案確認の合図として特別なメッセージを送る
      await submitUserMessage('CONFIRM_STRUCTURE', null);
    } catch (error) {
      console.error('Error during confirmation:', error);
      // エラーが発生した場合はボタンを元に戻す
      if (button) {
        button.disabled = false;
        button.textContent = '作成開始';
      }
    }
  };

  const handleSaveEdit = async () => {
    // 編集された構成案を送信
    await submitUserMessage(`EDIT_STRUCTURE:${JSON.stringify(editedStructure)}`, null);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedStructure(structure);
    setIsEditing(false);
  };

  const updateSectionTitle = (index: number, title: string) => {
    const newSections = [...editedStructure.sections];
    newSections[index] = { ...newSections[index], title };
    setEditedStructure({ ...editedStructure, sections: newSections });
  };

  const updateSectionDescription = (index: number, description: string) => {
    const newSections = [...editedStructure.sections];
    newSections[index] = { ...newSections[index], description };
    setEditedStructure({ ...editedStructure, sections: newSections });
  };

  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'hero': return '🎯';
      case 'features': return '⭐';
      case 'testimonials': return '💬';
      case 'cta': return '🚀';
      case 'faq': return '❓';
      case 'footer': return '📄';
      default: return '📝';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {isEditing ? (
            <input
              type="text"
              value={editedStructure.title}
              onChange={(e) => setEditedStructure({ ...editedStructure, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-2xl font-bold"
            />
          ) : (
            structure.title
          )}
        </h2>
        <p className="text-gray-600">
          以下の構成でランディングページを作成します。問題なければ「作成開始」ボタンをクリックしてください。
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {(isEditing ? editedStructure : structure).sections.map((section, index) => (
          <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-2xl">{getSectionIcon(section.type)}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  {section.type}
                </span>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                  セクション {index + 1}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedStructure.sections[index].title}
                    onChange={(e) => updateSectionTitle(index, e.target.value)}
                    className="w-full px-3 py-1 border border-gray-300 rounded-md"
                  />
                ) : (
                  section.title
                )}
              </h3>
              <p className="text-gray-600 text-sm">
                {isEditing ? (
                  <textarea
                    value={editedStructure.sections[index].description}
                    onChange={(e) => updateSectionDescription(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                    rows={2}
                  />
                ) : (
                  section.description
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3">
        {isEditing ? (
          <>
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              キャンセル
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              保存
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              編集
            </button>
            <button
              onClick={handleConfirm}
              data-confirm="true"
              className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              作成開始
            </button>
          </>
        )}
      </div>
    </div>
  );
}