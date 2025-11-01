export function handleLogout() {
  localStorage.removeItem("wp-user")
  localStorage.removeItem("wp-cards")
  window.location.href = "/"
}

export function handleLogin(email: string, password: string): boolean {
  const usersData = localStorage.getItem("wp-users")
  const users = usersData ? JSON.parse(usersData) : []

  const user = users.find((u: any) => u.email === email && u.password === password)

  if (user) {
    localStorage.setItem(
      "wp-user",
      JSON.stringify({
        name: user.name,
        emoji: user.emoji,
        color: user.color,
        email: user.email,
      }),
    )
    return true
  }

  return false
}

export function handleRegister(userData: {
  name: string
  email: string
  password: string
  emoji: string
  color: string
}): { success: boolean; error?: string } {
  const usersData = localStorage.getItem("wp-users")
  const users = usersData ? JSON.parse(usersData) : []

  if (users.some((u: any) => u.email === userData.email)) {
    return { success: false, error: "email already exists" }
  }

  const newUser = {
    ...userData,
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)
  localStorage.setItem("wp-users", JSON.stringify(users))

  localStorage.setItem(
    "wp-user",
    JSON.stringify({
      name: newUser.name,
      emoji: newUser.emoji,
      color: newUser.color,
      email: newUser.email,
    }),
  )

  return { success: true }
}
