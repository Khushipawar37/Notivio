import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  className?: string
}

export function FeatureCard({ icon: Icon, title, description, className }: FeatureCardProps) {
  return (
    <Card className={`border border-[#c6ac8f]/30 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="pb-2">
        <div className="bg-[#f5f0e8] w-10 h-10 rounded-full flex items-center justify-center mb-2">
          <Icon className="h-5 w-5 text-[#8a7559]" />
        </div>
        <CardTitle className="text-lg text-[#8a7559]">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-gray-600">{description}</CardDescription>
      </CardContent>
    </Card>
  )
}
