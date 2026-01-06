/* ============================================================
   生辰输入表单 - 高级玻璃态设计
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
  { value: 'male', label: '男', icon: '♂' },
  { value: 'female', label: '女', icon: '♀' },
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
    <form
      onSubmit={handleSubmit}
      className="
        relative w-full max-w-lg p-8
        bg-gradient-to-br from-white/[0.06] to-white/[0.02]
        backdrop-blur-xl border border-white/[0.08] rounded-2xl
        shadow-[0_8px_40px_rgba(0,0,0,0.3)]
      "
    >
      {/* 顶部发光线 */}
      <div
        className="
          absolute top-0 left-1/2 -translate-x-1/2
          w-1/2 h-px
          bg-gradient-to-r from-transparent via-star/40 to-transparent
        "
      />

      {/* 标题区域 */}
      <div className="text-center mb-8">
        <h2
          className="
            text-2xl font-semibold mb-2
            bg-gradient-to-r from-text via-text-secondary to-text
            bg-clip-text text-transparent
          "
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          输入您的出生信息
        </h2>
        <p className="text-sm text-text-muted">
          精准排盘，探索命运轨迹
        </p>
      </div>

      <div className="space-y-6">
        {/* 出生日期区块 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary font-medium">出生日期</span>
            <span
              className="
                text-xs px-2.5 py-1 rounded-full
                bg-gradient-to-r from-gold/20 to-gold/10
                text-gold border border-gold/20
              "
            >
              阳历
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Select
              options={YEAR_OPTIONS}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
            <Select
              options={MONTH_OPTIONS}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            />
            <Select
              options={DAY_OPTIONS}
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
            />
          </div>
        </div>

        {/* 出生时辰 */}
        <Select
          label="出生时辰"
          options={HOUR_OPTIONS}
          value={hour}
          onChange={(e) => setHour(Number(e.target.value))}
        />

        {/* 性别选择 - 胶囊按钮组 */}
        <div className="space-y-2">
          <span className="text-sm text-text-secondary font-medium">性别</span>
          <div className="flex gap-3">
            {GENDER_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`
                  group relative flex-1 py-3 px-4 rounded-xl
                  flex items-center justify-center gap-2
                  cursor-pointer transition-all duration-200
                  ${gender === opt.value
                    ? 'bg-gradient-to-r from-star to-star-dark text-white shadow-[0_4px_20px_rgba(124,58,237,0.3)]'
                    : 'bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12]'
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
                <span
                  className={`
                    text-lg transition-transform duration-200
                    ${gender === opt.value ? 'scale-110' : 'opacity-60 group-hover:opacity-80'}
                  `}
                >
                  {opt.icon}
                </span>
                <span className="font-medium">{opt.label}</span>
                {/* 选中指示器 */}
                {gender === opt.value && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gold shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                )}
              </label>
            ))}
          </div>
        </div>

        {/* 出生地（可选） */}
        <Input
          label="出生地（可选）"
          placeholder="如：北京、成都、乌鲁木齐"
          hint="用于真太阳时校正，可提高准确度"
        />

        {/* 分隔线 */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.06]" />
          </div>
        </div>

        {/* 提交按钮 */}
        <Button
          type="submit"
          variant="gold"
          size="lg"
          className="w-full group"
          disabled={loading}
        >
          {loading ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              排盘中...
            </>
          ) : (
            <>
              <span>开始排盘</span>
              <svg
                className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </Button>
      </div>

      {/* 底部提示 */}
      <p className="text-xs text-text-muted text-center mt-6 flex items-center justify-center gap-1.5">
        <svg className="w-3.5 h-3.5 text-star-light" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        请输入阳历（公历）日期，系统会自动转为农历排盘
      </p>

      {/* 角落装饰 */}
      <div className="absolute -bottom-2 -right-2 w-16 h-16 opacity-20">
        <div className="absolute inset-0 rounded-full border border-star/30" />
        <div className="absolute inset-2 rounded-full border border-gold/20" />
        <div className="absolute inset-4 rounded-full border border-star/10" />
      </div>
    </form>
  )
}
