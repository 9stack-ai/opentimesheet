"use client";

import * as React from "react";
import { Play, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { startSession, endSession, cancelSession } from "./session-actions";

const MAX_MS = 4 * 60 * 60 * 1000; // 4h
const MIN_MS = 60 * 1000; // 1 phút — dưới mức này không cho ghi
const fieldClass =
  "rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

type TaskOption = { id: string; label: string };

/** elapsed ms → "HH:MM:SS", clamped to the 4h cap. */
function fmt(ms: number): string {
  const total = Math.floor(Math.min(Math.max(0, ms), MAX_MS) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

export function WorkSessionCard({
  activeSince,
  tasks,
}: {
  activeSince: string | null;
  tasks: TaskOption[];
}) {
  // Hooks must run unconditionally — tick only while a session is active.
  const [nowMs, setNowMs] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  React.useEffect(() => {
    if (!activeSince) return;
    const tick = () => setNowMs(Date.now());
    const first = setTimeout(tick, 0); // first paint update async (avoids sync setState in effect)
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [activeSince]);

  if (!activeSince) {
    return (
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div>
            <div className="font-medium">Phiên làm việc</div>
            <p className="text-sm text-muted-foreground">
              Bấm Bắt đầu để tự ghi nhận thời gian làm việc (tối đa 4h mỗi phiên).
            </p>
          </div>
          <form action={startSession}>
            <SubmitButton>
              <Play className="size-4" /> Bắt đầu phiên
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
    );
  }

  const elapsed = Math.max(0, nowMs - Date.parse(activeSince));
  const over = elapsed >= MAX_MS;
  const tooShort = elapsed < MIN_MS;
  const recordHours = (Math.min(elapsed, MAX_MS) / 3_600_000).toFixed(2);

  return (
    <Card
      className={
        over ? "border-amber-400 bg-amber-50/70" : "border-emerald-500/60 bg-emerald-50/70 dark:bg-emerald-950/20"
      }
    >
      <CardContent className="flex flex-wrap items-center gap-4 py-4">
        <div className="flex items-center gap-3">
          {/* Chấm "live" nhấp nháy để CTV thấy rõ phiên đang chạy. */}
          <span className="relative flex size-3" aria-hidden>
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${over ? "bg-amber-400" : "bg-emerald-400"}`}
            />
            <span className={`relative inline-flex size-3 rounded-full ${over ? "bg-amber-500" : "bg-emerald-500"}`} />
          </span>
          <div>
            <div
              className={`text-xs font-semibold uppercase tracking-wide ${over ? "text-amber-700" : "text-emerald-700"}`}
            >
              Đang làm việc
            </div>
            <div className="font-mono text-3xl font-bold tabular-nums">{fmt(elapsed)}</div>
          </div>
        </div>
        {over ? (
          <span className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
            Đã đạt tối đa 4h — chỉ ghi 4h
          </span>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Square className="size-4" /> Kết thúc
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Kết thúc phiên — ghi công</DialogTitle>
              </DialogHeader>
              {tasks.length === 0 ? (
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground">
                    Bạn chưa được phân vào dự án nào nên không thể ghi công. Có thể huỷ phiên.
                  </p>
                  <DialogFooter>
                    <form action={cancelSession} onSubmit={() => setOpen(false)}>
                      <SubmitButton variant="outline">Huỷ phiên</SubmitButton>
                    </form>
                  </DialogFooter>
                </div>
              ) : (
                <form action={endSession} onSubmit={() => setOpen(false)} className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="sess-task">Công việc (task)</Label>
                    <select id="sess-task" name="taskId" required defaultValue="" className={`h-9 ${fieldClass}`}>
                      <option value="" disabled>
                        Chọn task…
                      </option>
                      {tasks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sess-note">Nội dung công việc</Label>
                    <textarea
                      id="sess-note"
                      name="note"
                      rows={3}
                      maxLength={500}
                      placeholder="Mô tả việc đã làm trong phiên…"
                      className={fieldClass}
                    />
                  </div>
                  <p className={`text-xs ${tooShort || over ? "text-amber-700" : "text-muted-foreground"}`}>
                    {tooShort
                      ? "Phiên quá ngắn — cần ít nhất 1 phút mới ghi được."
                      : over
                        ? "Phiên vượt 4h — chỉ ghi 4h."
                        : `Sẽ ghi ~${recordHours}h.`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Lưu xong, công ở trạng thái <span className="font-medium">Nháp</span> — bạn có thể sửa lại
                    (task, giờ, ghi chú) ở bảng bên dưới rồi mới Gửi duyệt.
                  </p>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Đóng
                      </Button>
                    </DialogClose>
                    <SubmitButton disabled={tooShort}>Lưu công</SubmitButton>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <X className="size-4" /> Huỷ
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Huỷ phiên đang chạy?</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Thời gian đã đếm (<span className="font-mono font-medium">{fmt(elapsed)}</span>) sẽ không được ghi
                lại. Bạn chắc chắn muốn huỷ?
              </p>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Không
                  </Button>
                </DialogClose>
                <form action={cancelSession} onSubmit={() => setCancelOpen(false)}>
                  <SubmitButton variant="destructive" pendingText="Đang huỷ…">
                    Huỷ phiên
                  </SubmitButton>
                </form>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
