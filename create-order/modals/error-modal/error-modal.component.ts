import { Component, Inject } from '@angular/core';
import { CommonMatModule } from '../../../../../../shared-components/common-module/common-mat.module';
import { Observable, Subscription } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store, select } from '@ngrx/store';
import { AppThemeState } from '../../../../../../../state-management/app.state';
import { selectTheme } from '../../../../../../../state-management/change-theme/change-theme.selector';

@Component({
  selector: 'app-error-modal',
  standalone: true,
  imports: [CommonMatModule],
  templateUrl: './error-modal.component.html',
  styleUrl: './error-modal.component.scss',
})
export class ErrorModalComponent {
  theme$: Observable<string>;
  themeSubscription: Subscription = new Subscription();
  isDarkThemeEnabled: boolean = true;
  copiedLot: boolean = false;
  lastRow: boolean = false;
  showDepartmentCodeWarning: boolean = false;
  cancelOrderWarning: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<ErrorModalComponent>,
    private store: Store<AppThemeState>
  ) {
    this.theme$ = this.store.pipe(select(selectTheme));
  }
  closeModal() {
    this.dialogRef.close();
  }
  proceed(bool: boolean) {
    this.dialogRef.close(bool);
  }
  cancelOrder(bool: boolean) {
    this.dialogRef.close(bool);
  }
  ngOnInit(): void {
    this.themeSubscription = this.theme$.subscribe((theme: string) => {
      this.isDarkThemeEnabled = theme === 'dark';
    });
    this.copiedLot = this.data.copiedLot;
    this.lastRow = this.data.lastRow;
    this.showDepartmentCodeWarning = this.data.showDepartmentCodeWarning;
    this.cancelOrderWarning = this.data.cancelOrderWarning;
  }
  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    this.themeSubscription.unsubscribe();
  }
}
