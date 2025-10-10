"use client";

import { type RefObject, useEffect, useMemo, useRef } from "react";

type UseModalAccessibilityParams = {
  isOpen: boolean;
  panelRef: RefObject<HTMLElement | null>;
  triggerRef: RefObject<HTMLElement | null>;
  onClose: () => void;
};

// カスタムフック: モーダル/ドロワーの基本的なアクセシビリティ制御
export function useModalAccessibility({
  isOpen,
  panelRef,
  triggerRef,
  onClose,
}: UseModalAccessibilityParams) {
  const wasOpenRef = useRef(false);

  // メニューを開いたときに本文のスクロールをロックする
  useEffect(() => {
    if (!isOpen) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  // escキーで終了
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  // フォーカス可能要素の取得（オープン時に一度計算）
  const focusables = useMemo(() => {
    if (!isOpen) return [] as HTMLElement[];
    const panel = panelRef.current;
    if (!panel) return [] as HTMLElement[];
    const nodes = panel.querySelectorAll<HTMLElement>(
      'a, button, [tabindex]:not([tabindex="-1"])',
    );
    return Array.from(nodes).filter(
      (el) =>
        !el.hasAttribute("disabled") &&
        el.getAttribute("aria-hidden") !== "true",
    );
  }, [isOpen, panelRef]);

  // 初期フォーカス & 閉じたらトリガーに復帰
  useEffect(() => {
    if (isOpen) {
      focusables[0]?.focus();
    } else if (wasOpenRef.current) {
      triggerRef.current?.focus();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, focusables, triggerRef]);

  // フォーカストラップ（Tab/Shift+Tab）
  useEffect(() => {
    if (!isOpen) return;
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const elements = focusables;
      if (elements.length === 0) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleTab);
    return () => window.removeEventListener("keydown", handleTab);
  }, [isOpen, focusables]);
}
