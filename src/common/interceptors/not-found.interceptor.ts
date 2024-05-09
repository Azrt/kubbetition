import { CallHandler, ExecutionContext, Injectable, NestInterceptor, NotFoundException } from "@nestjs/common";
import { Observable, tap } from "rxjs";

@Injectable()
export class NotFoundInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle()
      .pipe(tap(data => {
        if (data === null || typeof data === 'undefined' || (Array.isArray(data) && !data.length)) throw new NotFoundException();
      }));
  }
}