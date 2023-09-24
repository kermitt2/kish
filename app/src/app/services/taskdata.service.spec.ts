import { TestBed } from '@angular/core/testing';

import { TaskdataService } from './taskdata.service';

describe('TaskdataService', () => {
  let service: TaskdataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskdataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
