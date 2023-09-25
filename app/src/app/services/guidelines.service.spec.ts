import { TestBed } from '@angular/core/testing';

import { GuidelinesService } from './guidelines.service';

describe('GuidelinesService', () => {
  let service: GuidelinesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GuidelinesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
