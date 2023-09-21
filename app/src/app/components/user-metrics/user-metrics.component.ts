import { Component, OnInit, Input } from '@angular/core';
import { User } from '../../interfaces/user';

@Component({
  selector: 'app-user-metrics',
  templateUrl: './user-metrics.component.html',
  styleUrls: ['./user-metrics.component.css']
})
export class UserMetricsComponent {
  @Input() userInfo: User;
}
