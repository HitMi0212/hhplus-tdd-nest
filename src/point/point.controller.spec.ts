import { Test, TestingModule } from '@nestjs/testing';
import { PointController } from './point.controller';
import { PointService } from './point.service';
import { DatabaseModule } from '../database/database.module';
import { PointHistory, TransactionType, UserPoint } from './point.model';
import { PointBody } from './point.dto';
// import * as PointService from './point.service';

describe('PointController', () => {
    let controller: PointController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [DatabaseModule],
            controllers: [PointController],
            providers: [PointService],
        }).compile();

        controller = module.get<PointController>(PointController);
    });

    describe('특정 사용자 포인트 조회', () => {
        it('정상적으로 조회되는 경우', async () => {
            const userId: number = 123;
            const result: UserPoint = await controller.point(userId);

            expect(result.id).toStrictEqual(userId);
            expect(result.point).toStrictEqual(0);
        });

        it.each(['hanghae', '123asd'])(
            '사용자ID 형식이 number가 아닌경우 예외 발생',
            async (userId: string) => {
                await expect(controller.point(userId)).rejects.toThrow(
                    '올바르지 않은 ID 값 입니다.',
                );
            },
        );
    });

    describe('특정 사용자 포인트 충전', () => {
        it('정상적으로 충전되는 경우', async () => {
            const userId: number = 123;
            const PointBody: PointBody = { amount: 2500 };

            const expectResult = {
                id: 123,
                point: 2500,
                updateMillis: expect.any(Number),
            };
            expect(await controller.charge(userId, PointBody)).toEqual(
                expectResult,
            );
        });

        it.each(['hanghae', '123asd'])(
            '사용자ID 형식이 number가 아닌경우',
            async (userId: string) => {
                const PointBody: PointBody = { amount: 1000 };

                await expect(
                    controller.charge(userId, PointBody),
                ).rejects.toThrow('올바르지 않은 ID 값 입니다.');
            },
        );

        it('충전할 포인트가 음수인 경우', async () => {
            const PointBody: PointBody = { amount: -1000 };

            await expect(controller.charge(123, PointBody)).rejects.toThrow(
                '올바르지 않은 포인트 값 입니다.',
            );
        });
    });

    describe('특정 사용자 포인트 사용', () => {
        it('정상적으로 사용되는 경우', async () => {
            const userId: number = 123;
            const chargePoint: PointBody = { amount: 2500 };
            const usePoint: PointBody = { amount: 1000 };

            await controller.charge(userId, chargePoint);

            const expectResult = {
                id: 123,
                point: 1500,
                updateMillis: expect.any(Number),
            };
            expect(await controller.use(userId, usePoint)).toEqual(
                expectResult,
            );
        });

        it.each(['hanghae', '123asd'])(
            '사용자ID 형식이 number가 아닌경우',
            async (userId: string) => {
                const PointBody: PointBody = { amount: 1000 };

                await expect(controller.use(userId, PointBody)).rejects.toThrow(
                    '올바르지 않은 ID 값 입니다.',
                );
            },
        );

        it('사용할 포인트가 음수인 경우', async () => {
            const PointBody: PointBody = { amount: -1000 };

            await expect(controller.use(123, PointBody)).rejects.toThrow(
                '올바르지 않은 포인트 값 입니다.',
            );
        });
    });

    describe('특정 사용자 포인트 내역 조회', () => {
        it('정상적으로 조회되는 경우', async () => {
            const PointBody: PointBody = { amount: 2500 };

            await controller.charge(123, PointBody);

            const expectResult = [
                {
                    id: 1,
                    userId: 123,
                    amount: 2500,
                    type: TransactionType.CHARGE,
                    timeMillis: expect.any(Number),
                },
            ];

            expect(await controller.history(123)).toEqual(expectResult);
        });

        it.each(['hanghae', '123asd'])(
            '사용자ID 형식이 number가 아닌경우',
            async (userId) => {
                await expect(controller.history(userId)).rejects.toThrow(
                    '올바르지 않은 ID 값 입니다.',
                );
            },
        );
    });
});
