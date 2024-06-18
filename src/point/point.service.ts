import { Injectable } from '@nestjs/common';
import { PointHistoryTable } from '../database/pointhistory.table';
import { UserPointTable } from '../database/userpoint.table';
import { PointHistory, TransactionType, UserPoint } from './point.model';

@Injectable()
export class PointService {
    constructor(
        private readonly userDb: UserPointTable,
        private readonly historyDb: PointHistoryTable,
    ) {}

    // 포인트 조회
    async getUserPoint(id: number): Promise<UserPoint> {
        return await this.userDb.selectById(id);
    }
    // 포인트 이력 조회
    async getUserPointHistories(id: number): Promise<PointHistory[]> {
        return await this.historyDb.selectAllByUserId(id);
    }

    // 포인트 충전
    async chargeUserPoint(id: number, amount: number): Promise<UserPoint> {
        const userPoint: UserPoint = await this.getUserPoint(id);

        if (isNaN(amount) || amount < 0) {
            throw new Error('올바르지 않은 포인트 값 입니다.');
        }

        const totalPoint: number = userPoint.point + amount;

        await this.userDb.insertOrUpdate(userPoint.id, totalPoint);
        await this.historyDb.insert(
            userPoint.id,
            amount,
            TransactionType.CHARGE,
            Date.now(),
        );

        return this.getUserPoint(id);
    }
    // 포인트 사용
    async useUserPoint(id: number, amount: number): Promise<UserPoint> {
        const userPoint: UserPoint = await this.getUserPoint(id);

        if (isNaN(amount) || amount < 0) {
            throw new Error('올바르지 않은 포인트 값 입니다.');
        }

        const totalPoint: number = userPoint.point - amount;

        if (userPoint.point <= 0) {
            throw new Error('사용가능한 포인트가 없습니다.');
        } else if (totalPoint < 0) {
            throw new Error('포인트 잔액이 부족합니다.');
        }

        await this.userDb.insertOrUpdate(userPoint.id, totalPoint);
        await this.historyDb.insert(
            userPoint.id,
            amount,
            TransactionType.USE,
            Date.now(),
        );

        return this.getUserPoint(id);
    }

    async changeUserPoint(
        id: number,
        amount: number,
        transactionType: TransactionType,
    ): Promise<UserPoint> {
        const userPoint: UserPoint = await this.getUserPoint(id);

        const totalPoint: number = userPoint.point + amount;

        if (transactionType === TransactionType.USE && userPoint.point <= 0) {
            throw new Error('사용가능한 포인트가 없습니다.');
        } else if (totalPoint < 0) {
            throw new Error('포인트 잔액이 부족합니다.');
        }

        await this.userDb.insertOrUpdate(userPoint.id, totalPoint);
        await this.historyDb.insert(
            userPoint.id,
            amount,
            transactionType,
            Date.now(),
        );

        return this.getUserPoint(id);
    }
}
