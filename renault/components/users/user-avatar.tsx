"use client"

import { getUserInitials } from "@/lib/user-utils"
import type { User } from "@/lib/types"

interface UserAvatarProps {
  user: User
  size?: "sm" | "md" | "lg"
}

export function UserAvatar({ user, size = "md" }: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  }

  const initials = getUserInitials(user)

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center`}
    >
      {initials}
    </div>
  )
}
