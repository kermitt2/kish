import { Component, OnInit, Input } from '@angular/core';
import { User } from '../../interfaces/user';

@Component({
  selector: 'app-dataset-creation',
  templateUrl: './dataset-creation.component.html',
  styleUrls: ['./dataset-creation.component.css']
})
export class DatasetCreationComponent {
  @Input() userInfo: User;
}
