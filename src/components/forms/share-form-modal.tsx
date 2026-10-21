"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Copy, Check, QrCode, Code, Link as LinkIcon, Download } from "lucide-react";

interface ShareFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formId: string;
  slug: string;
  title: string;
  locale: "en" | "ar";
}

export function ShareFormModal({
  isOpen,
  onClose,
  slug,
  title,
  locale,
}: ShareFormModalProps) {
  const isAr = locale === "ar";
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://gdg-nctu-hr.vercel.app";
  const publicUrl = `${origin}/${locale}/forms/p/${slug}`;

  const embedSnippet = `<iframe src="${publicUrl}" width="100%" height="800" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>`;

  useEffect(() => {
    if (isOpen && publicUrl) {
      QRCode.toDataURL(publicUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: "#1a73e8",
          light: "#ffffff",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.warn("QR generation error:", err));
    }
  }, [isOpen, publicUrl]);

  const copyToClipboard = (text: string, type: "link" | "embed") => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === "link") {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedEmbed(true);
        setTimeout(() => setCopiedEmbed(false), 2000);
      }
    }
  };

  const downloadQrCode = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qrcode-${slug}.png`;
    a.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-foreground">
            {isAr ? "مشاركة ونشر النموذج" : "Share & Publish Form"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isAr
              ? `مشاركة رابط "${title}" عبر الرابط المباشر، رمز الاستجابة السريعة (QR)، أو التضمين.`
              : `Share "${title}" via direct link, QR code, or embedded widget.`}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="link" className="text-xs flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5" />
              <span>{isAr ? "الرابط المباشر" : "Direct Link"}</span>
            </TabsTrigger>
            <TabsTrigger value="qr" className="text-xs flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5" />
              <span>{isAr ? "رمز QR" : "QR Code"}</span>
            </TabsTrigger>
            <TabsTrigger value="embed" className="text-xs flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5" />
              <span>{isAr ? "كود التضمين" : "Embed Snippet"}</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Direct Link */}
          <TabsContent value="link" className="space-y-3 pt-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground block">
                {isAr ? "رابط الاستمارة للجمهور" : "Public Form URL"}
              </label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={publicUrl}
                  className="font-mono text-xs bg-muted/40 selection:bg-primary/20"
                  dir="ltr"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => copyToClipboard(publicUrl, "link")}
                  className="shrink-0 text-xs gap-1"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? (isAr ? "تم النسخ" : "Copied!") : (isAr ? "نسخ" : "Copy")}</span>
                </Button>
              </div>
            </div>

            <div className="p-3 bg-muted/30 rounded-xl border border-border/60 text-[11px] text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">
                {isAr ? "نصيحة للمشاركة:" : "Sharing Tip:"}
              </p>
              <p>
                {isAr
                  ? "يمكنك نشر هذا الرابط على قنوات التلجرام، مجموعات الواتساب، أو منصات التواصل."
                  : "Distribute this link directly to university students, WhatsApp groups, or email announcements."}
              </p>
            </div>
          </TabsContent>

          {/* Tab 2: QR Code */}
          <TabsContent value="qr" className="pt-3 flex flex-col items-center space-y-3">
            {qrDataUrl ? (
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-border flex flex-col items-center">
                <img
                  src={qrDataUrl}
                  alt="Form QR Code"
                  className="w-48 h-48 rounded-lg"
                />
                <span className="text-[11px] text-slate-500 font-mono mt-2">{slug}</span>
              </div>
            ) : (
              <div className="w-48 h-48 bg-muted rounded-2xl animate-pulse flex items-center justify-center text-xs text-muted-foreground">
                Generating QR...
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadQrCode}
              className="text-xs gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAr ? "تحميل صورة QR Code عالية الدقة" : "Download PNG QR Code"}</span>
            </Button>
          </TabsContent>

          {/* Tab 3: Embed Snippet */}
          <TabsContent value="embed" className="space-y-3 pt-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground block">
                {isAr ? "كود التضمين (HTML iFrame)" : "HTML Embed Code (iFrame)"}
              </label>
              <textarea
                readOnly
                value={embedSnippet}
                rows={3}
                className="w-full text-xs font-mono p-2.5 rounded-lg bg-muted/40 border border-border text-foreground"
                dir="ltr"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(embedSnippet, "embed")}
                className="text-xs gap-1"
              >
                {copiedEmbed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedEmbed ? (isAr ? "تم نسخ الكود" : "Code Copied!") : (isAr ? "نسخ كود التضمين" : "Copy Snippet")}</span>
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
            {isAr ? "إغلاق" : "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
