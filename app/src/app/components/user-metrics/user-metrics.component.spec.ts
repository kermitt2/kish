import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserMetricsComponent } from './user-metrics.component';

describe('UserMetricsComponent', () => {
  let component: UserMetricsComponent;
  let fixture: ComponentFixture<UserMetricsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UserMetricsComponent]
    });
    fixture = TestBed.createComponent(UserMetricsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
