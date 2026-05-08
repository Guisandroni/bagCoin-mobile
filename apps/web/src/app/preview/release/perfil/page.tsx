"use client"

import { ProfileView } from "@/components/release"
import { mockProfile } from "@/components/release/__preview__/mock-data"

export default function PerfilPreview() {
  return (
    <ProfileView
      profile={mockProfile}
      onBack={() => console.log("Back")}
      onChangePassword={() => console.log("Change password")}
      onSave={(data) => console.log("Save:", data)}
    />
  )
}