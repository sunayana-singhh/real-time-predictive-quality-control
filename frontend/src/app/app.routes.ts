import { Routes } from '@angular/router';
import { UploadComponent } from './components/upload/upload.component';
import { DateRangesComponent } from './components/date-ranges/date-ranges.component';
import { TrainingComponent } from './components/training/training.component';
import { SimulationComponent } from './components/simulation/simulation.component';

export const routes: Routes = [
  { path: '', redirectTo: '/upload', pathMatch: 'full' },
  { path: 'upload', component: UploadComponent },
  { path: 'date-ranges', component: DateRangesComponent },
  { path: 'training', component: TrainingComponent },
  { path: 'simulation', component: SimulationComponent },
  { path: '**', redirectTo: '/upload' }
];
