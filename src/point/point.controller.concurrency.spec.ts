import { Test, TestingModule } from '@nestjs/testing';
import { PointController } from './point.controller';
import { PointService } from './point.service';
import { DatabaseModule } from '../database/database.module';

describe('동시성 테스트', () => {
    let pointController: PointController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [DatabaseModule],
            controllers: [PointController],
            providers: [PointService],
        }).compile();

        pointController = module.get<PointController>(PointController);
    });

    it('동시에 포인트 충전 및 차감을 해도 순차적으로 처리되어야 한다.', async () => {
        const userId = 1;
        // given - 10000 원 충전 시작
        await pointController.charge(userId, { amount: 10000 });
        // when - 각 태스크 병렬 수행 및 기다림
        const chargeWork = async (amount: number) => {
            return await pointController.charge(userId, { amount: amount });
        };
        const useWork = async (amount: number) => {
            return await pointController.use(userId, { amount: amount });
        };
        // Promise.all() : Promise들을 동시에 병렬 실행
        await Promise.all([
            chargeWork(1000),
            useWork(100),
            useWork(5000),
            chargeWork(1000),
        ]);

        // then - 결과 검증
        const userPoint = await pointController.point(userId);
        expect(userPoint.point).toEqual(6900);
    });
});
