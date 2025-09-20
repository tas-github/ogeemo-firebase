'use server';

import { adminDb as db } from '@/lib/firebase-admin';
import { collection, query, where, getDocs, writeBatch, doc, Timestamp } from 'firebase-admin/firestore';
import { eachDayOfInterval, isWeekday, set, addMinutes } from 'date-fns';
import type { PlanningRitual } from '@/hooks/use-user-preferences';
import { type TaskStatus } from '@/types/calendar-types';

type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
const dayNameToIndex: Record<DayOfWeek, number> = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };

const TASKS_COLLECTION = 'tasks';

export async function upsertRitualTask(
    userId: string,
    ritualType: 'daily' | 'weekly',
    settings: PlanningRitual,
    dateRange: { from: Date, to: Date }
) {
    if (!userId) {
        throw new Error("User ID is required to update planning rituals.");
    }
    const batch = db.batch();
    const tasksRef = collection(db, TASKS_COLLECTION);

    // 1. Delete all existing ritual tasks for this user and type
    const q = query(tasksRef, where("userId", "==", userId), where("ritualType", "==", ritualType));
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    // 2. If the ritual is enabled, create new events for the specified date range
    if (settings.enabled) {
        const [hour, minute] = settings.time.split(':').map(Number);
        
        // Ensure dates are correctly handled as Date objects
        const startDate = new Date(dateRange.from);
        const endDate = new Date(dateRange.to);

        const allDatesInRange = eachDayOfInterval({ start: startDate, end: endDate });

        const taskDataTemplate = {
            title: ritualType === 'daily' ? 'Daily Wind-Down & Plan' : 'Weekly Strategic Review',
            description: ritualType === 'daily'
                ? 'A protected 25-minute block to review today and plan for tomorrow.'
                : 'A protected 90-minute block to review all projects and set goals for the week ahead.',
            isScheduled: true,
            status: 'todo' as TaskStatus,
            ritualType: ritualType,
            userId,
            position: -1, // Indicates it's a special, non-board task
        };

        if (ritualType === 'daily') {
            const weekdays = allDatesInRange.filter(date => isWeekday(date));
            weekdays.forEach(day => {
                const start = set(day, { hours: hour, minutes: minute, seconds: 0, milliseconds: 0 });
                const end = addMinutes(start, settings.duration);
                const taskRef = doc(tasksRef);
                batch.set(taskRef, { ...taskDataTemplate, start: Timestamp.fromDate(start), end: Timestamp.fromDate(end) });
            });
        } else if (ritualType === 'weekly' && settings.day) {
            const dayIndex = dayNameToIndex[settings.day];
            const matchingDays = allDatesInRange.filter(date => date.getDay() === dayIndex);
            matchingDays.forEach(day => {
                const start = set(day, { hours: hour, minutes: minute, seconds: 0, milliseconds: 0 });
                const end = addMinutes(start, settings.duration);
                const taskRef = doc(tasksRef);
                batch.set(taskRef, { ...taskDataTemplate, start: Timestamp.fromDate(start), end: Timestamp.fromDate(end) });
            });
        }
    }

    // 3. Commit all changes
    await batch.commit();
}
