"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BoardColumn } from "../_components/board-column"
import { Users, LogOut, Search, Filter, BarChart3, Download, Upload, Clock } from "lucide-react"
import { Input } from "../_components/ui/input"
import { handleLogout } from "../utils/auth" // Import handleLogout from auth utils

interface User {
  name: string
  emoji: string
  color: string
}

interface Comment {
  id: string
  author: User
  content: string
  timestamp: number
}

interface Card {
  id: string
  content: string
  author: User
  column: string
  priority: "high" | "medium" | "low"
  likes: string[]
  dislikes: string[]
  comments: Comment[]
  assignedTo?: User
  timestamp: number
  tags: string[]
}

const getStoredUser = (): User | null => {
  if (typeof window === "undefined") return null

  const stored = localStorage.getItem("wp-user")
  if (!stored) return null

  try {
    return JSON.parse(stored) as User
  } catch (error) {
    console.error("Failed to parse stored user:", error)
    return null
  }
}

const getStoredCards = (): Card[] => {
  if (typeof window === "undefined") return []

  const stored = localStorage.getItem("wp-cards")
  if (!stored) return []

  try {
    return JSON.parse(stored) as Card[]
  } catch (error) {
    console.error("Failed to parse stored cards:", error)
    return []
  }
}

const COLUMNS = [
  { id: "ideas", title: "Ideas", color: "wp-cyan" },
  { id: "discuss", title: "Discuss", color: "wp-magenta" },
  { id: "decided", title: "Decided", color: "wp-lime" },
]

export default function BoardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterPriority, setFilterPriority] = useState<"all" | "high" | "medium" | "low">("all")
  const [filterUser, setFilterUser] = useState<string | "all">("all")
  const [showStats, setShowStats] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [sessionTime, setSessionTime] = useState(0)

  useEffect(() => {
    const storedUser = getStoredUser()
    const storedCards = getStoredCards()
    setUser(storedUser)
    setCards(storedCards)

    if (!storedUser) {
      router.push("/")
      return
    }
  }, [router])

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "wp-user") {
        setUser(getStoredUser())
      }

      if (event.key === "wp-cards") {
        setCards(getStoredCards())
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  useEffect(() => {
    if (cards.length > 0) {
      localStorage.setItem("wp-cards", JSON.stringify(cards))
    }
  }, [cards])

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTime((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleAddCard = (columnId: string, content: string, priority: "high" | "medium" | "low") => {
    if (!user) return

    const newCard: Card = {
      id: Date.now().toString(),
      content,
      author: user,
      column: columnId,
      priority,
      likes: [],
      dislikes: [],
      comments: [],
      timestamp: Date.now(),
      tags: [],
    }

    setCards([...cards, newCard])
  }

  const handleMoveCard = (cardId: string, newColumn: string) => {
    setCards(cards.map((card) => (card.id === cardId ? { ...card, column: newColumn } : card)))
  }

  const handleDeleteCard = (cardId: string) => {
    setCards(cards.filter((card) => card.id !== cardId))
  }

  const handleVote = (cardId: string, type: "like" | "dislike") => {
    if (!user) return

    setCards(
      cards.map((card) => {
        if (card.id !== cardId) return card

        const newCard = { ...card }

        if (type === "like") {
          if (newCard.likes.includes(user.name)) {
            newCard.likes = newCard.likes.filter((name) => name !== user.name)
          } else {
            newCard.likes = [...newCard.likes, user.name]
            newCard.dislikes = newCard.dislikes.filter((name) => name !== user.name)
          }
        } else {
          if (newCard.dislikes.includes(user.name)) {
            newCard.dislikes = newCard.dislikes.filter((name) => name !== user.name)
          } else {
            newCard.dislikes = [...newCard.dislikes, user.name]
            newCard.likes = newCard.likes.filter((name) => name !== user.name)
          }
        }

        return newCard
      }),
    )
  }

  const handleAddComment = (cardId: string, content: string) => {
    if (!user) return

    setCards(
      cards.map((card) => {
        if (card.id !== cardId) return card

        const newComment: Comment = {
          id: Date.now().toString(),
          author: user,
          content,
          timestamp: Date.now(),
        }

        return {
          ...card,
          comments: [...card.comments, newComment],
        }
      }),
    )
  }

  const handleChangePriority = (cardId: string, priority: "high" | "medium" | "low") => {
    setCards(cards.map((card) => (card.id === cardId ? { ...card, priority } : card)))
  }

  const handleAssignUser = (cardId: string, assignedUser: User | undefined) => {
    setCards(cards.map((card) => (card.id === cardId ? { ...card, assignedTo: assignedUser } : card)))
  }

  const handleAddTag = (cardId: string, tag: string) => {
    setCards(
      cards.map((card) => {
        if (card.id !== cardId) return card
        if (card.tags.includes(tag)) return card
        return { ...card, tags: [...card.tags, tag] }
      }),
    )
  }

  const handleRemoveTag = (cardId: string, tag: string) => {
    setCards(
      cards.map((card) => {
        if (card.id !== cardId) return card
        return { ...card, tags: card.tags.filter((t) => t !== tag) }
      }),
    )
  }

  const handleExport = () => {
    const data = {
      cards,
      exportDate: new Date().toISOString(),
      user: user?.name,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `decision-board-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (data.cards) {
          setCards(data.cards)
        }
      } catch (error) {
        console.error("Failed to import data:", error)
      }
    }
    reader.readAsText(file)
  }

  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      searchQuery === "" ||
      card.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesPriority = filterPriority === "all" || card.priority === filterPriority

    const matchesUser = filterUser === "all" || card.author.name === filterUser || card.assignedTo?.name === filterUser

    return matchesSearch && matchesPriority && matchesUser
  })

  const activeUsers = user ? [user] : []

  const stats = {
    total: cards.length,
    ideas: cards.filter((c) => c.column === "ideas").length,
    discuss: cards.filter((c) => c.column === "discuss").length,
    decided: cards.filter((c) => c.column === "decided").length,
    high: cards.filter((c) => c.priority === "high").length,
    medium: cards.filter((c) => c.priority === "medium").length,
    low: cards.filter((c) => c.priority === "low").length,
    totalLikes: cards.reduce((sum, c) => sum + c.likes.length, 0),
    totalComments: cards.reduce((sum, c) => sum + c.comments.length, 0),
  }

  const formatSessionTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  if (!user) return null

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-[#1a1a1a] border-b-2 border-[#333333]">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold tracking-tight text-white">decision board</h1>
            <div className="flex items-center gap-2 px-4 py-2 bg-[#2d2d2d]">
              <Users className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">{activeUsers.length}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-[#2d2d2d]">
              <Clock className="w-4 h-4 text-[#00AFF0]" />
              <span className="text-sm font-semibold text-white">{formatSessionTime(sessionTime)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-4 py-2 bg-[#2d2d2d]">
              <span className="text-2xl">{user.emoji}</span>
              <span className="font-semibold text-white">{user.name}</span>
              <div className="w-4 h-4" style={{ backgroundColor: user.color }} />
            </div>

            <button
              onClick={handleLogout}
              className="w-12 h-12 bg-[#2d2d2d] hover:bg-[#e81123] transition-colors flex items-center justify-center"
            >
              <LogOut className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </header>

      <div className="bg-[#1a1a1a] border-b-2 border-[#333333]">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px] max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="search cards..."
                className="h-10 pl-10 bg-[#000000] border-2 border-[#333333] focus:border-[#00AFF0] text-white placeholder:text-[#666666] rounded-none"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-10 px-4 font-semibold flex items-center gap-2 transition-colors ${
                showFilters ? "bg-[#00AFF0] text-white" : "bg-[#2d2d2d] text-white hover:bg-[#3d3d3d]"
              }`}
            >
              <Filter className="w-4 h-4" />
              filters
            </button>

            <button
              onClick={() => setShowStats(!showStats)}
              className={`h-10 px-4 font-semibold flex items-center gap-2 transition-colors ${
                showStats ? "bg-[#00AFF0] text-white" : "bg-[#2d2d2d] text-white hover:bg-[#3d3d3d]"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              stats
            </button>

            <button
              onClick={handleExport}
              className="h-10 px-4 bg-[#2d2d2d] text-white hover:bg-[#3d3d3d] font-semibold flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              export
            </button>

            <label className="h-10 px-4 bg-[#2d2d2d] text-white hover:bg-[#3d3d3d] font-semibold flex items-center gap-2 transition-colors cursor-pointer">
              <Upload className="w-4 h-4" />
              import
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>

          {showFilters && (
            <div className="mt-3 pt-3 border-t-2 border-[#333333] flex items-center gap-3 flex-wrap">
              <span className="text-xs text-[#999999] font-semibold uppercase tracking-wider">priority:</span>
              <div className="flex gap-2">
                {(["all", "high", "medium", "low"] as const).map((priority) => (
                  <button
                    key={priority}
                    onClick={() => setFilterPriority(priority)}
                    className={`h-8 px-3 font-semibold text-sm transition-colors ${
                      filterPriority === priority
                        ? "bg-[#00AFF0] text-white"
                        : "bg-[#2d2d2d] text-white hover:bg-[#3d3d3d]"
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>

              <span className="text-xs text-[#999999] font-semibold uppercase tracking-wider ml-4">user:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterUser("all")}
                  className={`h-8 px-3 font-semibold text-sm transition-colors ${
                    filterUser === "all" ? "bg-[#00AFF0] text-white" : "bg-[#2d2d2d] text-white hover:bg-[#3d3d3d]"
                  }`}
                >
                  all
                </button>
                {activeUsers.map((u) => (
                  <button
                    key={u.name}
                    onClick={() => setFilterUser(u.name)}
                    className={`h-8 px-3 font-semibold text-sm flex items-center gap-2 transition-colors ${
                      filterUser === u.name ? "bg-[#00AFF0] text-white" : "bg-[#2d2d2d] text-white hover:bg-[#3d3d3d]"
                    }`}
                  >
                    <span>{u.emoji}</span>
                    {u.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showStats && (
            <div className="mt-3 pt-3 border-t-2 border-[#333333]">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                <div className="bg-[#2d2d2d] p-3">
                  <div className="text-2xl font-bold text-white">{stats.total}</div>
                  <div className="text-xs text-[#999999] uppercase tracking-wider">total cards</div>
                </div>
                <div className="bg-[#00AFF0] p-3">
                  <div className="text-2xl font-bold text-white">{stats.ideas}</div>
                  <div className="text-xs text-white uppercase tracking-wider">ideas</div>
                </div>
                <div className="bg-[#E3008C] p-3">
                  <div className="text-2xl font-bold text-white">{stats.discuss}</div>
                  <div className="text-xs text-white uppercase tracking-wider">discuss</div>
                </div>
                <div className="bg-[#8CBF26] p-3">
                  <div className="text-2xl font-bold text-white">{stats.decided}</div>
                  <div className="text-xs text-white uppercase tracking-wider">decided</div>
                </div>
                <div className="bg-[#e81123] p-3">
                  <div className="text-2xl font-bold text-white">{stats.high}</div>
                  <div className="text-xs text-white uppercase tracking-wider">high priority</div>
                </div>
                <div className="bg-[#FA6800] p-3">
                  <div className="text-2xl font-bold text-white">{stats.medium}</div>
                  <div className="text-xs text-white uppercase tracking-wider">medium</div>
                </div>
                <div className="bg-[#2d2d2d] p-3">
                  <div className="text-2xl font-bold text-white">{stats.totalLikes}</div>
                  <div className="text-xs text-[#999999] uppercase tracking-wider">total votes</div>
                </div>
                <div className="bg-[#2d2d2d] p-3">
                  <div className="text-2xl font-bold text-white">{stats.totalComments}</div>
                  <div className="text-xs text-[#999999] uppercase tracking-wider">comments</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#1a1a1a] border-b-2 border-[#333333]">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center gap-4">
            <span className="text-xs text-[#999999] font-semibold uppercase tracking-wider">active now</span>
            <div className="flex gap-2">
              {activeUsers.map((u, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-[#2d2d2d]">
                  <span className="text-lg">{u.emoji}</span>
                  <span className="text-sm font-medium text-white">{u.name}</span>
                  <div className="w-3 h-3" style={{ backgroundColor: u.color }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          {COLUMNS.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
              cards={filteredCards.filter((card) => card.column === column.id)}
              onAddCard={handleAddCard}
              onMoveCard={handleMoveCard}
              onDeleteCard={handleDeleteCard}
              onVote={handleVote}
              onAddComment={handleAddComment}
              onChangePriority={handleChangePriority}
              onAssignUser={handleAssignUser}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
              currentUser={user}
              activeUsers={activeUsers}
            />
          ))}
        </div>
      </main>
    </div>
  )
}
