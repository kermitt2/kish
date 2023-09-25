import { TestBed } from '@angular/core/testing';

import { ApiBaseService } from './api-base.service';

describe('ApiBaseService', () => {
  let service: ApiBaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiBaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
