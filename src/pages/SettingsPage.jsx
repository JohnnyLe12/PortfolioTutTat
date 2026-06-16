import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, Trash2, AlertTriangle, Loader2 } from "lucide-react";

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
import { apiDelete, clearTokens } from "../lib/api";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

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
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-600">Manage your account preferences</p>
        </div>
      </div>

      {/* Danger Zone */}
      <Card className="border-2 border-red-200">
        <CardContent className="p-6">
          <h2 className="text-lg font-bold text-red-700 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </h2>
          <p className="text-gray-600 mb-4">
            Once you delete your account, there is no going back. All your data including
            portfolios, feedback, messages, and profile information will be permanently removed.
          </p>
          <Button
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Account Permanently
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
              Type <span className="font-bold text-red-600">DELETE</span> to confirm
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
              Cancel
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
                  Delete My Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
