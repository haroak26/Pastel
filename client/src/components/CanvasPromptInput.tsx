import { useState, useRef } from "react";
import { ArrowUp, ArrowRight, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/button";
import type { ClarifyQuestion } from "@/hooks/use-pastel-agent";

type Props = {
  questions: ClarifyQuestion[];
  answers: Record<string, string>;
  onAnswerChange: (id: string, value: string) => void;
  onSubmit: () => void;
  onSkip?: () => void;
  isLoading?: boolean;
};

export function CanvasPromptInput({
  questions,
  answers,
  onAnswerChange,
  onSubmit,
  onSkip,
  isLoading,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localText, setLocalText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const isFirst = currentIndex === 0;

  const hasCurrentAnswer = (answers[currentQuestion?.id] || "").trim().length > 0;
  const allAnswered = questions.every((q) => (answers[q.id] || "").trim().length > 0);

  const handleSelectOption = (option: string) => {
    onAnswerChange(currentQuestion.id, option);
    setLocalText("");
    if (!isLast) {
      setTimeout(() => setCurrentIndex((i) => i + 1), 200);
    }
  };

  const handleTextSubmit = () => {
    const trimmed = localText.trim();
    if (!trimmed) return;
    onAnswerChange(currentQuestion.id, trimmed);
    setLocalText("");
    if (!isLast) {
      setTimeout(() => setCurrentIndex((i) => i + 1), 200);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  };

  const handleConfirmSubmit = () => {
    if (allAnswered) {
      onSubmit();
    }
  };

  if (!currentQuestion) return null;

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="rounded-[20px] border border-border bg-background shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden">
        {/* Question navigation header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentIndex((i) => i - 1)}
              disabled={isFirst}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={15} strokeWidth={1.5} />
            </button>
            <span className="text-[11px] font-semibold text-fg-muted tabular-nums">
              {currentIndex + 1} of {questions.length}
            </span>
            <button
              onClick={() => setCurrentIndex((i) => i + 1)}
              disabled={isLast}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={15} strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-fg-faint uppercase tracking-wider">
              Clarify
            </span>
            {onSkip && (
              <button
                onClick={onSkip}
                disabled={isLoading}
                className="text-[11px] font-medium text-fg-muted hover:text-brand transition-colors border-none bg-transparent cursor-pointer disabled:opacity-40"
              >
                Skip →
              </button>
            )}
          </div>
        </div>

        {/* Question text */}
        <div className="px-4 pt-3 pb-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand mb-1">
            {currentQuestion.title}
          </p>
          <p className="text-[15px] font-medium text-foreground leading-snug">
            {currentQuestion.question}
          </p>
          <p className="text-[11px] text-fg-muted leading-relaxed mt-1.5">
            {currentQuestion.whyItMatters}
          </p>
        </div>

        {/* Multiple choice options */}
        {currentQuestion.options && currentQuestion.options.length > 0 && (
          <div className="px-4 py-2 flex flex-wrap gap-1.5">
            {currentQuestion.options.map((option) => {
              const isSelected = answers[currentQuestion.id] === option.label;
              return (
                <button
                  key={option.label}
                  onClick={() => handleSelectOption(option.label)}
                  className={`flex-1 min-w-[46%] text-left px-3 py-2 rounded-[12px] text-[12px] transition-all duration-150 border cursor-pointer ${
                    isSelected
                      ? "bg-brand/10 text-foreground border-brand/50"
                      : "bg-surface-muted text-fg-muted border-border/60 hover:border-brand/40 hover:text-foreground"
                  }`}
                >
                  <span className="block font-semibold">{option.label}</span>
                  <span className="block text-[10px] leading-relaxed mt-0.5 opacity-80">{option.description}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Type your own */}
        <div className="px-4 pb-1">
          <div className="flex items-center gap-2 rounded-[12px] border border-border/60 bg-surface-muted focus-within:border-brand/40 focus-within:bg-background transition-all duration-150">
            <textarea
              ref={textareaRef}
              value={localText}
              onChange={(e) => setLocalText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={hasCurrentAnswer ? answers[currentQuestion.id] : (currentQuestion.placeholder || "Or describe a different direction...")}
              rows={1}
              className="flex-1 resize-none bg-transparent text-[13px] text-foreground placeholder:text-fg-faint px-3 py-2 outline-none border-none leading-relaxed"
            />
            {localText.trim() && (
              <button
                onClick={handleTextSubmit}
                className="flex items-center justify-center w-7 h-7 mr-1 rounded-lg bg-brand text-white hover:bg-brand/90 transition-colors border-none cursor-pointer shrink-0"
              >
                <ArrowUp size={13} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        {/* Bottom actions */}
        <div className="flex items-center justify-between px-4 pb-4 pt-2">
          <div className="flex items-center gap-1.5">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-200 border-none cursor-pointer ${
                  idx === currentIndex
                    ? "bg-brand w-4"
                    : (answers[questions[idx].id] || "").trim()
                      ? "bg-brand/40"
                      : "bg-border/60"
                }`}
              />
            ))}
          </div>

          {isLast ? (
            <Button
              onClick={handleConfirmSubmit}
              disabled={!allAnswered || isLoading}
              size="sm"
              className="rounded-[10px] gap-1.5"
            >
              Generate
              <ArrowUp size={14} strokeWidth={2} />
            </Button>
          ) : (
            <button
              onClick={() => setCurrentIndex((i) => i + 1)}
              className="flex items-center gap-1.5 h-[32px] px-3 rounded-[10px] text-[13px] font-medium text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer"
            >
              Next
              <ArrowRight size={13} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
