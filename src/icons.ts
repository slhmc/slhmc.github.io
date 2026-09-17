// Original Pixelarticons SVGs, bundled locally. MIT © Gerrit Halfmann.
import arrow from 'pixelarticons/svg/arrow-right.svg?raw';
import arrowDown from 'pixelarticons/svg/arrow-down.svg?raw';
import chevronDown from 'pixelarticons/svg/chevron-down.svg?raw';
import down from 'pixelarticons/svg/download.svg?raw';
import home from 'pixelarticons/svg/home.svg?raw';
import cube from 'pixelarticons/svg/box.svg?raw';
import search from 'pixelarticons/svg/search.svg?raw';
import settings from 'pixelarticons/svg/settings-cog-2.svg?raw';
import general from 'pixelarticons/svg/settings-2.svg?raw';
import appearance from 'pixelarticons/svg/colors-swatch.svg?raw';
import minecraft from 'pixelarticons/svg/gamepad.svg?raw';
import java from 'pixelarticons/svg/coffee.svg?raw';
import accounts from 'pixelarticons/svg/user.svg?raw';
import storage from 'pixelarticons/svg/server.svg?raw';
import bell from 'pixelarticons/svg/bell.svg?raw';
import sync from 'pixelarticons/svg/database.svg?raw';
import consoleIcon from 'pixelarticons/svg/terminal.svg?raw';
import shield from 'pixelarticons/svg/shield.svg?raw';
import lock from 'pixelarticons/svg/lock.svg?raw';
import plus from 'pixelarticons/svg/plus.svg?raw';
import close from 'pixelarticons/svg/close.svg?raw';
import check from 'pixelarticons/svg/check.svg?raw';
import bolt from 'pixelarticons/svg/zap.svg?raw';
import github from 'pixelarticons/svg/github.svg?raw';
import discord from 'pixelarticons/svg/discord.svg?raw';
import windows from 'pixelarticons/svg/app-windows.svg?raw';
import fullscreen from 'pixelarticons/svg/scale.svg?raw';
import previous from 'pixelarticons/svg/chevron-left.svg?raw';
import next from 'pixelarticons/svg/chevron-right.svg?raw';
import pause from 'pixelarticons/svg/pause.svg?raw';
import play from 'pixelarticons/svg/play.svg?raw';

const icons: Record<string, string> = { arrow, arrowDown, chevronDown, "arrow-down": arrowDown, "chevron-down": chevronDown, down, home, cube, search, settings, general, appearance, minecraft, java, accounts, storage, bell, sync, console: consoleIcon, shield, lock, plus, close, check, bolt, github, discord, windows, fullscreen, previous, next, pause, play };
export function icon(name: string, className = ''): string {
  return (icons[name] ?? cube).replace('<svg ', `<svg class="icon ${className}" aria-hidden="true" focusable="false" `);
}
