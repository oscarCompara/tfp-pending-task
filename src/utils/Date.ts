
import { differenceInMinutes } from 'date-fns'

export const getDurationTask = (date:  Date, dateTask:  Date) => {
    const minutes = differenceInMinutes(date, dateTask)
    const days = Math.floor(minutes / (24 * 60))
    const hours = Math.floor((minutes % (24 * 60)) / 60)
    const remainingMinutes = minutes % 60

    const formattedDays = days > 0 ? `${days}d` : ''
    const formattedHours = hours > 0 ? `${hours}h` : ''
    const formattedMinutes = remainingMinutes > 0 ? `${remainingMinutes}m` : '00'

    return `${formattedDays} ${formattedHours} ${formattedMinutes}`
}
