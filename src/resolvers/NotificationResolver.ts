import { RepositoryInjector } from '../RepositoryInjector'
import { Arg, Ctx, ID, Mutation, Query, Resolver, UseMiddleware } from 'type-graphql'
import { RequiresAuth } from '../RequiresAuth'
import { ReplyNotification } from '../entities/ReplyNotification'
import { Context } from '../Context'

@Resolver()
export class NotificationResolver extends RepositoryInjector {
  @UseMiddleware(RequiresAuth)
  @Query(returns => [ReplyNotification])
  async notifications(@Arg('unreadOnly') unreadOnly: boolean, @Ctx() { userId }: Context) {
    const qb = this.replyNotifRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.fromUser', 'fromUser')
      .leftJoinAndSelect('notification.post', 'post')
      .leftJoinAndSelect('notification.comment', 'comment', 'comment.deleted = false')
      .addOrderBy('notification.createdAt', 'DESC')
      .andWhere('notification.toUserId = :userId', { userId })

    if (unreadOnly) qb.andWhere('notification.read = false')

    const notifications = await qb.getMany()

    return notifications.filter(notif => notif.comment !== null && notif.comment !== undefined)
  }

  @UseMiddleware(RequiresAuth)
  @Mutation(returns => Boolean)
  async markNotificationRead(@Arg('id', type => ID) id: string, @Ctx() { userId }: Context) {
    await this.replyNotifRepository
      .createQueryBuilder()
      .update()
      .set({ read: true })
      .where('id = :id', { id })
      .andWhere('toUserId = :userId', { userId })
      .execute()
    return true
  }

  @UseMiddleware(RequiresAuth)
  @Mutation(returns => Boolean)
  async markAllNotificationsRead(@Ctx() { userId }: Context) {
    await this.replyNotifRepository
      .createQueryBuilder()
      .update()
      .set({ read: true })
      .where('toUserId = :userId', { userId })
      .execute()
    return true
  }
}