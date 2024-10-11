import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { CommonMatModule } from '../../../../../../shared-components/common-module/common-mat.module';
import { Observable, Subscription } from 'rxjs';
import { Store, select } from '@ngrx/store';
import { AppThemeState } from '../../../../../../../state-management/app.state';
import { selectTheme } from '../../../../../../../state-management/change-theme/change-theme.selector';
@Component({
  selector: 'app-preview-modal',
  standalone: true,
  imports: [MatDialogTitle, MatDialogContent, MatDialogModule, CommonMatModule],
  templateUrl: './preview-modal.component.html',
  styleUrl: './preview-modal.component.scss',
})
export class PreviewModalComponent implements OnInit, OnDestroy {
  theme$: Observable<string>;
  themeSubscription: Subscription = new Subscription();
  isDarkThemeEnabled: boolean = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { preview: string },
    public dialogRef: MatDialogRef<PreviewModalComponent>,
    private store: Store<AppThemeState>
  ) {
    this.theme$ = this.store.pipe(select(selectTheme));
  }
  closeModal() {
    this.dialogRef.close();
  }
  ngOnInit(): void {
    this.themeSubscription = this.theme$.subscribe((theme: string) => {
      this.isDarkThemeEnabled = theme === 'dark';
    });
  }
  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    this.themeSubscription.unsubscribe();
  }
}
