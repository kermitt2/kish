import { Component, OnInit, Input } from '@angular/core';
import { User } from '../../interfaces/user';
import { DatasetService } from '../../services/dataset.service';
import { ToastrService } from '../../services/toastr.service';
import { Observable } from 'rxjs';    
import { MainComponent} from '../main/main.component';
import { Dataset } from '../../interfaces/dataset';

@Component({
  selector: 'app-dataset-metrics',
  templateUrl: './dataset-metrics.component.html',
  styleUrls: ['./dataset-metrics.component.css']
})
export class DatasetMetricsComponent implements OnInit {
  @Input() userInfo: User;

  datasetProfiles: string[] = [];
  datasetMetrics: Array<any>;

  constructor(private datasetService: DatasetService, private toastrService: ToastrService) { }

  ngOnInit(): void {
    this.setDatasetProfiles();
  }

  setDatasetProfiles(): void {
    this.datasetService.getDatasets()
        .subscribe(
          (data: any) =>  {  // success
            this.datasetProfiles = data["records"];
            console.log(this.datasetProfiles);
            this.datasetMetrics = new Array<any>(this.datasetProfiles.length);
            for (let i=0; i< this.datasetProfiles.length; i++) {
              console.log(this.datasetProfiles[i]);
              this.setDatasetMetrics(this.datasetProfiles[i], i);
            }
          }, 
          (error: any)   => console.log(error), // error
          ()             => { console.log('all dataset id get'); } // completed
       );
  }

  setDatasetMetrics(dataset_id: string, index: number): void {
    // display the metrics for one given dataset
    this.datasetService.getDatasetMetrics(dataset_id)
        .subscribe(
          (data: any) =>  {  // success
            this.datasetMetrics[index] = data["metrics"];
            console.log(this.datasetMetrics[index]);
            // normalize percentages
            if (this.datasetMetrics[index]["percentage_agreement"])              
              this.datasetMetrics[index]["percentage_agreement"] = (this.datasetMetrics[index]["percentage_agreement"] * 100).toFixed(2);            
             if (this.datasetMetrics[index]["progress"])
              this.datasetMetrics[index]["progress"] = (this.datasetMetrics[index]["progress"] * 100).toFixed(2);
          }, 
          (error: any)   => this.toastrService.callToaster("toast-top-center", "error", error["message"], "Damn, accessing the dataset metrics didn't work!"),
          ()             => console.log('dataset metrics get') // completed
       );
  }

}
