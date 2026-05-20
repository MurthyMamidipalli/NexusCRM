import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Mail, Phone, Calendar, ArrowUpRight } from 'lucide-react'

const activities = [
  { id: 1, user: 'John Doe', action: 'sent an email to', target: 'Acme Corp', type: 'email', time: '2 hours ago' },
  { id: 2, user: 'Sarah Smith', action: 'called', target: 'Globex Corp', type: 'call', time: '4 hours ago' },
  { id: 3, user: 'Alex Wong', action: 'scheduled meeting with', target: 'Initech', type: 'meeting', time: '5 hours ago' },
  { id: 4, user: 'Emily Brown', action: 'updated deal value for', target: 'Stark Ind', type: 'deal', time: '1 day ago' },
]

export function RecentActivity() {
  return (
    <Card className="border-none bg-card/50 backdrop-blur-md shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Activity Stream</CardTitle>
        <CardDescription>Real-time updates across your sales team.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {activities.map((activity) => (
            <div key={activity.id} className="group flex items-start gap-4">
              <Avatar className="h-9 w-9 border-2 border-primary/10">
                <AvatarImage src={`https://picsum.photos/seed/${activity.user}/40/40`} />
                <AvatarFallback>{activity.user[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  <span className="text-foreground">{activity.user}</span>{' '}
                  <span className="text-muted-foreground">{activity.action}</span>{' '}
                  <span className="text-primary font-semibold">{activity.target}</span>
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {activity.type === 'email' && <Mail className="h-3 w-3" />}
                  {activity.type === 'call' && <Phone className="h-3 w-3" />}
                  {activity.type === 'meeting' && <Calendar className="h-3 w-3" />}
                  {activity.type === 'deal' && <ArrowUpRight className="h-3 w-3" />}
                  <span>{activity.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}