import { Component, OnInit, Input } from '@angular/core';
import { User } from '../../interfaces/user';

@Component({
  selector: 'app-dataset-export',
  templateUrl: './dataset-export.component.html',
  styleUrls: ['./dataset-export.component.css']
})
export class DatasetExportComponent {
  @Input() userInfo: User;
}
