"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { ArrowRight } from "lucide-react"

const EMOJIS = ["😊", "🚀", "💡", "🎯", "⭐", "🔥", "💪", "🎨", "🌟", "✨"]

const COLORS = [
  { name: "Cyan", value: "#00AFF0" },
  { name: "Magenta", value: "#E3008C" },
  { name: "Lime", value: "#8CBF26" },
  { name: "Orange", value: "#FA6800" },
  { name: "Purple", value: "#A200FF" },
  { name: "Blue", value: "#0078D7" },
  { name: "Red", value: "#E81123" },
  { name: "Green", value: "#107C10" },
]

export function UserSetup() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0])
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return

    const user = {
      name: name.trim(),
      emoji: selectedEmoji,
      color: selectedColor,
    }

    localStorage.setItem("wp-user", JSON.stringify(user))
    router.push("/board")
  }

  return (
    <div className="w-full max-w-lg">
      <div className="mb-12 text-left">
        <h1 className="text-5xl font-light mb-3 tracking-tight text-white">decision board</h1>
        <p className="text-[#999999] text-xl font-light">collaborate in real-time</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#999999]">your name</label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="enter your name"
            className="h-14 text-lg bg-[#1a1a1a] border-2 border-[#333333] focus:border-[#00AFF0] transition-colors text-white placeholder:text-[#666666] rounded-none"
            required
          />
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#999999]">choose emoji</label>
          <div className="grid grid-cols-5 gap-2">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setSelectedEmoji(emoji)}
                className={`aspect-square flex items-center justify-center text-3xl transition-all ${
                  selectedEmoji === emoji ? "bg-[#00AFF0] scale-105" : "bg-[#1a1a1a] hover:bg-[#2d2d2d]"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#999999]">choose color</label>
          <div className="grid grid-cols-4 gap-2">
            {COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => setSelectedColor(color.value)}
                className={`aspect-square flex items-center justify-center transition-transform ${
                  selectedColor === color.value ? "scale-105" : "hover:scale-95"
                }`}
                style={{ backgroundColor: color.value }}
              >
                {selectedColor === color.value && <span className="text-white text-3xl font-bold">✓</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 bg-[#1a1a1a] border-2 border-[#333333]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#999999] mb-3">preview</p>
          <div className="flex items-center gap-4">
            <span className="text-4xl">{selectedEmoji}</span>
            <span className="text-xl font-semibold text-white">{name || "your name"}</span>
            <div className="w-8 h-8 ml-auto" style={{ backgroundColor: selectedColor }} />
          </div>
        </div>

        <button
          type="submit"
          className="w-full h-16 text-lg font-semibold text-white flex items-center justify-center gap-3 transition-opacity disabled:opacity-50"
          style={{ backgroundColor: selectedColor }}
          disabled={!name.trim()}
        >
          start collaborating
          <ArrowRight className="w-6 h-6" />
        </button>
      </form>
    </div>
  )
}
