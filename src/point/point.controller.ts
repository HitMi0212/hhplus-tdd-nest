import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    ValidationPipe,
} from '@nestjs/common';
import { PointHistory, UserPoint } from './point.model';
import { UserPointTable } from '../database/userpoint.table';
import { PointHistoryTable } from '../database/pointhistory.table';
import { PointBody as PointDto } from './point.dto';
import { PointService } from './point.service';

@Controller('/point')
export class PointController {
    constructor(
        private readonly userDb: UserPointTable,
        private readonly historyDb: PointHistoryTable,
        private pointService: PointService,
    ) {}

    private readonly userPointPromiseMap = new Map<
        number,
        Promise<UserPoint>
    >();

    /**
     * TODO - 특정 유저의 포인트를 조회하는 기능을 작성해주세요.
     */
    @Get(':id')
    async point(@Param('id') id): Promise<UserPoint> {
        this.checkUserId(id);
        return this.pointService.getUserPoint(Number.parseInt(id));
    }

    /**
     * TODO - 특정 유저의 포인트 충전/이용 내역을 조회하는 기능을 작성해주세요.
     */
    @Get(':id/histories')
    async history(@Param('id') id): Promise<PointHistory[]> {
        this.checkUserId(id);
        return this.pointService.getUserPointHistories(Number.parseInt(id));
    }

    /**
     * TODO - 특정 유저의 포인트를 충전하는 기능을 작성해주세요.
     */
    @Patch(':id/charge')
    async charge(
        @Param('id') id,
        @Body(ValidationPipe) pointDto: PointDto,
    ): Promise<UserPoint> {
        this.checkUserId(id);

        const lastPromise =
            this.userPointPromiseMap.get(id) || Promise.resolve();

        const newPromise = lastPromise.then(async () => {
            return await this.pointService.chargeUserPoint(
                Number.parseInt(id),
                pointDto.amount,
            );
        });

        this.userPointPromiseMap.set(id, newPromise);

        return newPromise;
    }

    /**
     * TODO - 특정 유저의 포인트를 사용하는 기능을 작성해주세요.
     */
    @Patch(':id/use')
    async use(
        @Param('id') id,
        @Body(ValidationPipe) pointDto: PointDto,
    ): Promise<UserPoint> {
        this.checkUserId(id);

        const lastPromise =
            this.userPointPromiseMap.get(id) || Promise.resolve();

        const newPromise = lastPromise.then(async () => {
            return await this.pointService.useUserPoint(
                Number.parseInt(id),
                pointDto.amount,
            );
        });

        this.userPointPromiseMap.set(id, newPromise);

        return newPromise;
    }

    // 사용자ID 값 검사
    private checkUserId(id: string) {
        if (isNaN(Number(id))) {
            throw new Error('올바르지 않은 ID 값 입니다.');
        }
    }
}
