import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, Trash2, AlertTriangle, Loader2, Globe, Lock } from "lucide-react";

import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { apiDelete, apiPost, clearTokens } from "../lib/api";
import { useLanguage } from "../contexts/LanguageContext";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  async function handleDeleteAccount() {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    setError("");
    try {
      await apiDelete("/auth/delete-account");
      // Clear local session
      clearTokens();
      localStorage.removeItem("user");
      // Redirect to landing/login
      window.location.href = "/login";
    } catch (err) {
      setError(err.message || "Failed to delete account. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
          <Settings className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("settings.title")}</h1>
          <p className="text-sm text-gray-600">{t("settings.subtitle")}</p>
        </div>
      </div>

      {/* Change Password */}
      <Card className="border-2 mb-6">
        <CardContent className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Đổi mật khẩu
          </h2>
          {passwordSuccess ? (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm mb-4">
              Mật khẩu đã được thay đổi thành công!
            </div>
          ) : null}
          {passwordError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
              {passwordError}
            </div>
          )}
          <form onSubmit={async (e) => {
            e.preventDefault();
            setPasswordError("");
            setPasswordSuccess(false);
            if (newPassword.length < 8) { setPasswordError("Mật khẩu mới phải có ít nhất 8 ký tự"); return; }
            if (newPassword !== confirmNewPassword) { setPasswordError("Mật khẩu xác nhận không khớp"); return; }
            setPasswordChanging(true);
            try {
              await apiPost("/auth/change-password", { currentPassword, newPassword });
              setPasswordSuccess(true);
              setCurrentPassword("");
              setNewPassword("");
              setConfirmNewPassword("");
            } catch (err) {
              setPasswordError(err.message || "Không thể đổi mật khẩu");
            } finally {
              setPasswordChanging(false);
            }
          }} className="space-y-4">
            <div>
              <Label>Mật khẩu hiện tại</Label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label>Mật khẩu mới (tối thiểu 8 ký tự)</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label>Xác nhận mật khẩu mới</Label>
              <Input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required className="mt-1" />
            </div>
            <Button type="submit" disabled={passwordChanging} className="bg-indigo-600 hover:bg-indigo-700">
              {passwordChanging ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang xử lý...</> : "Đổi mật khẩu"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Language Switcher */}
      <Card className="border-2 mb-6">
        <CardContent className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            {t("settings.language")}
          </h2>
          <div className="flex gap-3">
            <Button
              variant={language === "vi" ? "default" : "outline"}
              onClick={() => setLanguage("vi")}
              className={language === "vi" ? "bg-indigo-600" : ""}
            >
              🇻🇳 Tiếng Việt
            </Button>
            <Button
              variant={language === "en" ? "default" : "outline"}
              onClick={() => setLanguage("en")}
              className={language === "en" ? "bg-indigo-600" : ""}
            >
              🇬🇧 English
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-2 border-red-200">
        <CardContent className="p-6">
          <h2 className="text-lg font-bold text-red-700 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            {t("settings.dangerZone")}
          </h2>
          <p className="text-gray-600 mb-4">
            {t("settings.deleteWarning")}
          </p>
          <Button
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t("settings.deleteAccount")}
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              {t("settings.deleteConfirm")}
            </DialogTitle>
            <DialogDescription>
              This action is irreversible. All your data will be permanently deleted including:
            </DialogDescription>
          </DialogHeader>

          <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1 my-2">
            <li>Your profile and account information</li>
            <li>All portfolios and media files</li>
            <li>Feedback requests and reviews</li>
            <li>Messages and conversations</li>
            <li>Job postings (if company account)</li>
            <li>Applications and bookmarks</li>
          </ul>

          <div className="mt-4">
            <Label className="text-sm font-medium">
              {t("settings.typeDelete")}
            </Label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="mt-2"
            />
          </div>

          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => { setShowDeleteDialog(false); setConfirmText(""); setError(""); }}
              disabled={deleting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteAccount}
              disabled={confirmText !== "DELETE" || deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("settings.deleteConfirm")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
