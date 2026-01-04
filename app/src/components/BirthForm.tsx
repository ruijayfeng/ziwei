/* ============================================================
   生辰输入表单
   ============================================================ */

import { useState } from 'react'
import { Button, Input, Select } from '@/components/ui'
import { generateChart, getShichenOptions, type BirthInfo, type Gender } from '@/lib/astro'
import { useChartStore } from '@/stores'

const currentYear = new Date().getFullYear()

const YEAR_OPTIONS = Array.from({ length: 100 }, (_, i) => ({
  value: currentYear - i,
  label: `${currentYear - i}年`,
}))

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}月`,
}))

const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}日`,
}))

const HOUR_OPTIONS = getShichenOptions()

const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
]

export function BirthForm() {
  const { setBirthInfo, setChart } = useChartStore()

  const [year, setYear] = useState(1990)
  const [month, setMonth] = useState(1)
  const [day, setDay] = useState(1)
  const [hour, setHour] = useState(12)
  const [gender, setGender] = useState<Gender>('male')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const birthInfo: BirthInfo = { year, month, day, hour, gender }
      const chart = generateChart(birthInfo)

      setBirthInfo(birthInfo)
      setChart(chart)
    } catch (error) {
      console.error('排盘失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass glass-glow p-6 w-full max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-6 text-center">输入您的出生信息</h2>

      <div className="space-y-4">
        {/* 出生日期 */}
        <div className="grid grid-cols-3 gap-3">
          <Select
            label="年"
            options={YEAR_OPTIONS}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          />
          <Select
            label="月"
            options={MONTH_OPTIONS}
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          />
          <Select
            label="日"
            options={DAY_OPTIONS}
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
          />
        </div>

        {/* 出生时辰 */}
        <Select
          label="出生时辰"
          options={HOUR_OPTIONS}
          value={hour}
          onChange={(e) => setHour(Number(e.target.value))}
        />

        {/* 性别 */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-text-secondary">性别</span>
          <div className="flex gap-3">
            {GENDER_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`
                  flex-1 py-2.5 px-4 rounded-xl text-center cursor-pointer transition-all
                  ${gender === opt.value
                    ? 'bg-star text-white'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }
                `}
              >
                <input
                  type="radio"
                  name="gender"
                  value={opt.value}
                  checked={gender === opt.value}
                  onChange={() => setGender(opt.value as Gender)}
                  className="sr-only"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* 出生地（可选） */}
        <Input
          label="出生地（可选，用于真太阳时校正）"
          placeholder="如：北京、成都、乌鲁木齐"
        />

        {/* 提交按钮 */}
        <Button type="submit" className="w-full mt-2" disabled={loading}>
          {loading ? '排盘中...' : '开始排盘'}
        </Button>
      </div>

      <p className="text-xs text-text-muted text-center mt-4">
        紫微斗数使用农历时间，系统会自动转换
      </p>
    </form>
  )
}
