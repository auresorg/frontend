'use client'
import { useDialog } from "@/components/ui/dialog-service"
import { useRouter } from "next/navigation"

// this is a hook — call it inside components
export function usePresetDialog() {
  const router = useRouter()
  const { showDialog } = useDialog()

  // return a callable function that can be used inside try/catch
  function PresetDialog(type: string) {
    switch (type) {
      case "sessionExpired":
        showDialog({
          title: "Session Expired",
          message: "Your session has expired. Please log in again.",
          type: "error",
          confirmText: "OK",
          onConfirm: () => router.push("/"),
          cancelText: "DONOT SHOW CANCEL",
        })
        break

      case "unexpectedError":
        showDialog({
          title: "Unexpected Error",
          message: "An unexpected error occurred. Please try again later.",
          type: "error",
          confirmText: "OK",
          onConfirm: () => {},
          cancelText: "DONOT SHOW CANCEL",
        })
        break

      case "networkError":
        showDialog({
          title: "Network Error",
          message: "A network error occurred. Please check your connection and try again.",
          type: "error",
          confirmText: "OK",
          onConfirm: () => {},
          cancelText: "DONOT SHOW CANCEL",
        })
        break

      default:
        console.warn(`No preset dialog for type: ${type}`)
        break
    }
  }

  return PresetDialog
}
